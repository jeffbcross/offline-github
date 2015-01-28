(function() {

function GithubService($window) {
  var self = this;
  this._worker = new $window.Worker('components/github-service/github-worker.js');
  this._queries = new Map();
  this._queryId = 0;
  this._dbInstanceResolvers = [];
  this._dbInstanceRejectors = [];

  this._worker.onmessage = function(msg) {
    var resolution, rejection;
    console.log('timestamp 2', performance.now())
    switch(msg.data.operation) {
      case 'query.success':
        resolution = self._queries.get(msg.data.queryId).resolve;
        resolution(msg.data.results)
        break;
      case 'query.error':
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

angular.module('ghoGithubService', []).
  service('github', ['$window', GithubService]);

}());
