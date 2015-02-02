(function() {

function GithubService($window) {
  var self = this;
  this._worker = new $window.Worker('components/github-service/github-worker.js');
  this._queries = new Map();
  this._queryId = 0;
  this._dbInstanceResolvers = [];
  this._dbInstanceRejectors = [];
  this._processes = new Map();

  this._worker.onmessage = function(msg) {
    var resolution, rejection;
    var operation = typeof msg.data === 'string'?msg.data:msg.data.operation;
    switch(operation) {
      case 'query.exec.success':
        console.log('query.exec.success', msg);
        resolution = self._queries.get(msg.data.queryId).resolve;
        resolution(msg.data.results)
        break;
      case 'query.exec.error':
        rejection = self._queries.get(msg.data.queryId).reject;
        rejection(msg.data.error)
        break;
      case 'count.exec.success':
        resolution = self._queries.get(msg.data.queryId).resolve;
        resolution(msg.data.results)
        break;
      case 'count.exec.error':
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
        var subject = self._processes.get(msg.data.queryId).subject;
        subject.onNext({totalCount: msg.data.count});
        break;
      case 'lastUpdated.set':
        localStorage.setItem(self._processes.get(msg.data.queryId).config.storageKey, msg.data.lastUpdated);
        break;
      case 'synchronize.fetch.success':
        console.log('synchronize.fetch.success', msg.data);
        var subject = self._processes.get(msg.data.queryId).subject;
        subject.onCompleted({totalCount: msg.data.count});
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

GithubService.prototype.count = function(config) {
  var self = this;
  config.operation = 'count.exec';
  config.queryId = this._queryId++
  return new Promise(function(resolve, reject) {
    self._queries.set(config.queryId, {
      resolve: resolve,
      reject: reject
    });
    self._worker.postMessage(config);
  });
}

GithubService.prototype.query = function(query) {
  var self = this;
  return new Promise(function(resolve, reject) {
    query.operation = 'query.exec';
    query.queryId = self._queryId++;

    self._queries.set(query.queryId, {
      resolve: resolve,
      reject: reject
    });

    self._worker.postMessage(query);
  });
}

GithubService.prototype.synchronize = function(config) {
  var subject = new Rx.Subject();
  config.operation = 'synchronize.fetch';
  config.queryId = ++this._queryId;

  this._worker.postMessage(config);
  this._processes.set(config.queryId, {
    config: config,
    subject: subject
  });
  return subject;
};

angular.module('ghoGithubService', []).
  service('github', ['$window', GithubService]);

}());
