(function() {

function GithubService($window) {
  var self = this;
  console.log('time before instantiating web worker', performance.now());
  this._worker = new $window.Worker('components/github-service/github-worker.js');
  this._queries = new Map();
  this._queryId = 0;
  this._dbInstanceResolvers = [];
  this._dbInstanceRejectors = [];
  this._processes = new Map();

  this._worker.onmessage = function(msg) {
    console.log('this._worker.onmessage', performance.now())
    var resolution, rejection;
    var operation = typeof msg.data === 'string'?msg.data:msg.data.operation;

    switch(operation) {
      case 'query.success':
        resolution = self._queries.get(msg.data.queryId).resolve;
        resolution(msg.data.results)
        break;
      case 'query.error':
        rejection = self._queries.get(msg.data.queryId).reject;
        rejection(msg.data.error)
        break;
      case 'count.success':
        resolution = self._queries.get(msg.data.queryId).resolve;
        resolution(msg.data.results)
        break;
      case 'count.error':
        rejection = self._queries.get(msg.data.queryId).reject;
        rejection(msg.data.error)
        break;
      case 'dbInstance.success':
        self._dbInstanceResolvers.forEach(function(resolver) {
          resolver();
        });
        break;
      case 'dbInstance.error':
        self._dbInstanceRejectors.forEach(function(rejector) {
          rejector();
        });
        break;
      case 'count.update':
        var subject = self._processes.get(msg.data.processId).subject;
        subject.onNext({totalCount: msg.data.count});
        break;
      case 'lastUpdated.set':
        localStorage.setItem(self._processes.get(msg.data.processId).config.storageKey, msg.data.lastUpdated);
        break;
    }
  }
}

GithubService.prototype.whenDbLoaded = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    self._dbInstanceResolvers.push(resolve);
    self._dbInstanceRejectors.push(reject);
  });
};

GithubService.prototype.count = function(query) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var queryId = self._queryId++;
    self._queries.set(queryId, {
      resolve: resolve,
      reject: reject
    });
    self._worker.postMessage({
      operation: 'count.exec',
      query: query,
      queryId: queryId
    });
  });
}

GithubService.prototype.query = function(query) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var queryId = self._queryId++;
    self._queries.set(queryId, {
      resolve: resolve,
      reject: reject
    });
    self._worker.postMessage({
      operation: 'query.exec',
      query: query,
      queryId: queryId
    });
  });
}

GithubService.prototype.synchronize = function(tableName, query, rowDefaults, url, storageKey) {
  var syncConfig = {
    operation: 'synchronize.fetch',
    tableName: tableName,
    query: query,
    rowDefaults: rowDefaults,
    url: url,
    storageKey: storageKey,
    processId: ++this._pids
  };
  this._worker.postMessage(syncConfig);
  this._processes.set(syncConfig.processId, {
    config: syncConfig,
    subject: new Rx.Subject()
  });
};

angular.module('ghoGithubService', []).
  service('github', ['$window', GithubService]);

}());
