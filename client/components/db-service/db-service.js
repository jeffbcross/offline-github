angular.module('ghoDBService', []).
  service('dbService', [function() {
    var db;
    var promise = github.db.getInstance().
      then(function(database) {
        db = database;
        return db;
      });

    this.get = function () {
      if (db) return Promise.resolve(db);
      return promise;
    }
  }]);