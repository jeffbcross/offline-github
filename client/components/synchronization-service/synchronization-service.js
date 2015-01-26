(function() {

function SyncService($window, firebaseAuth) {
  this._worker = new $window.Worker(
      'components/synchronization-service/synchronization-worker.js');
  this._processes = new Map();
  var self = this;
  this._firebaseAuth = firebaseAuth;
  this._pids = 0;

  this._worker.onmessage = function(e) {
    switch (e.data.operation) {
      case 'localStorage.getItem':
        this._worker.postMessage({
          operation: 'localStorage.getItem',
          result: localStorage.getItem(e.data.key),
          key: e.data.key
        });
        break;
      case 'localStorage.setItem':
        localStorage.setItem(e.data.key, e.data.payload);
        break;
      case 'firebaseAuth.getAuth':
        self._worker.postMessage({
          operation: 'firebaseAuth.getAuth',
          auth: firebaseAuth.getAuth(),
          processId: e.data.processId
        });
        break;
      case 'count.update':
        console.log('count.update', e.data.processId, e.data.count);
        var subject = self._processes.get(e.data.processId).subject;
        subject.onNext({totalCount: e.data.count});
        break;
      case 'lastUpdated.set':
        console.log('lastUpdated.set', e.data.lastUpdated);
        localStorage.setItem(self._processes.get(e.data.processId).config.storageKey, e.data.lastUpdated);
        break;
    }
  }
}

SyncService.prototype.synchronize = function(tableName, query, rowDefaults, url, storageKey) {
  var syncConfig = {
    operation: 'synchronize.fetch',
    tableName: tableName,
    query: query,
    rowDefaults: rowDefaults,
    url: url,
    storageKey: storageKey,
    processId: ++this._pids
  };
  console.log('pid', syncConfig.processId);
  this._worker.postMessage(syncConfig);
  this._processes.set(syncConfig.processId, {
    config: syncConfig,
    subject: new Rx.Subject()
  });
};

angular.module('ghoSynchronizationService', []).
  service('synchronizer', ['$window', 'firebaseAuth', SyncService]);
}());
