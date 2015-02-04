(function() {

function GithubService($window) {
  var self = this;
  var queryId = 0;
  this._worker = new $window.Worker('components/github-service/github-worker.js');
  this._queries = new Map();
  this._configs = new Map();

  this._worker.onmessage = function(msg) {
    if (typeof msg.data === 'object') {
      var data = Immutable.Map(msg.data);
      var observer = self._queries.get(data.get('queryId'));
      var operation = data.get('operation');
    }
    switch(operation) {
      case 'query.exec.success':
        observer.onNext(Immutable.List(data.get('results')));
        observer.onCompleted();
        break;
      case 'query.exec.progress':
        observer.onNext(Immutable.List(data.get('results')));
        break;
      case 'query.exec.error':
        observer.onError(data.get('error'));
        observer.onCompleted();
        break;
      case 'count.exec.success':
        observer.onNext(Immutable.List(data.get('results')));
        observer.onCompleted();
        break;
      case 'count.exec.error':
        observer.onError(data.get('error'));
        observer.onCompleted();
        break;
      case 'count.exec.progress':
        observer.onNext(Immutable.List(data.get('results')));
        break;
      case 'synchronize.fetch.progress':
        observer.onNext(Immutable.Map(self._configs.get(data.get('queryId'))));
        break;
      case 'lastUpdated.set':
        localStorage.setItem(data.get('storageKey'), data.get('lastUpdated'));
        break;
      case 'synchronize.fetch.success':
        var config = Immutable.Map(self._configs.get(data.get('queryId')));
        observer.onNext(config);
        observer.onCompleted();
        break;
    }
  }

  function workerConnectionFactory (operation) {
    return function(config) {
      return Rx.Observable.create(function(observer) {
        config = config.merge({
          operation: operation,
          queryId: getQueryId()
        });
        self._queries.set(config.get('queryId'), observer);
        self._configs.set(config.get('queryId'), config);
        self._worker.postMessage(config.toJS());
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
