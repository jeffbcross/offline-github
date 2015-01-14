/* global github:true */

(function() {

function getTableFactory () {
  return function(schema, name) {
    return schema['get'+name]();
  };
}

function dbService(USE_MEMORY_DB) {
  var db;
  var promise = github.db.getInstance(undefined, USE_MEMORY_DB).
    then(function(database) {
      db = database;
      return db;
    });

  this.get = function () {
    if (db) {
      return Promise.resolve(db);
    }
    return promise;
  };
}

angular.module('ghoDBService', []).
  //Allows using a volatile in-memory store for tests.
  constant('USE_MEMORY_DB', false).
  factory('getTable', [getTableFactory]).
  service('db', ['USE_MEMORY_DB', dbService]);

}());
