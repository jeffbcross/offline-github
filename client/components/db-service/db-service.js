angular.module('ghoDBService', []).
  //Allows using a volatile in-memory store for tests.
  constant('USE_MEMORY_DB', false).
  service('dbService', ['USE_MEMORY_DB', function(USE_MEMORY_DB) {
    var db;
    var promise = github.db.getInstance(undefined, USE_MEMORY_DB).
      then(function(database) {
        db = database;
        return db;
      });

    this.get = function () {
      if (db) return Promise.resolve(db);
      return promise;
    }
  }]);