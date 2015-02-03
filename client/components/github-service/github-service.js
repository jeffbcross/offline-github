(function() {

function GithubService($window) {
  var self = this;
  var queryId = 0;
  this._worker = new $window.Worker('components/github-service/github-worker.js');
  this._queries = new Map();
  this._configs = new Map();

  this._worker.onmessage = function(msg) {
    var resolution, rejection;
    var observer = self._queries.get(msg.data.queryId)
    var operation = typeof msg.data === 'string'?msg.data:msg.data.operation;
    switch(operation) {
      case 'query.exec.success':
        observer.onNext(msg.data.results);
        observer.onCompleted();
        break;
      case 'query.exec.progress':
        observer.onNext(msg.data.results);
        break;
      case 'query.exec.error':
        observer.onError(msg.data.error);
        observer.onCompleted();
        break;
      case 'count.exec.success':
        observer.onNext(msg.data.results);
        observer.onCompleted();
        break;
      case 'count.exec.error':
        observer.onError(msg.data.error);
        observer.onCompleted();
        break;
      case 'count.exec.progress':
        observer.onNext(msg.data.results);
        break;
      case 'synchronize.fetch.progress':
        observer.onNext(self._configs.get(msg.data.queryId));
        break;
      case 'lastUpdated.set':
        localStorage.setItem(msg.data.storageKey, msg.data.lastUpdated);
        break;
      case 'synchronize.fetch.success':
        var config = self._configs.get(msg.data.queryId);
        observer.onNext(config);
        observer.onCompleted();
        break;
    }
  }

  function workerConnectionFactory (operation) {
    return function(config) {
      return Rx.Observable.create(function(observer) {
        config.operation = operation;
        config.queryId = getQueryId();
        self._queries.set(config.queryId, observer);
        self._configs.set(config.queryId, config);
        self._worker.postMessage(config);
      });
    }
  }

  this.count = workerConnectionFactory('count.exec');
  this.query = workerConnectionFactory('query.exec');
  this.synchronize = workerConnectionFactory('synchronize.fetch');

  var getQueryId = function() {
    return ++queryId;
  }
}

angular.module('ghoGithubService', []).
  service('github', ['$window', GithubService]);

}());
