angular.module('ghoCacheModel', ['ghoDBService']).
  factory('CacheModel', ['$http', '$q', 'dbService', 'urlExpMerger', 'qAny', function($http, $q, dbService, urlExpMerger, qAny){
    function CacheModel(localSchemaName, remoteUrlExp){
      this.localSchemaName = localSchemaName;
      this.remoteUrlExp = remoteUrlExp;
    };

    CacheModel.prototype.dbQuery = function dbQuery(query) {
      var self = this;
      return dbService.get().then(function(db) {
        var schema;
        var from = db.
          select().
          from(schema = db.getSchema()['get'+self.localSchemaName]());

        return from.
          where(
            lf.op.and.apply(null, Object.keys(query).
              sort().
              map(function(k) {
                return schema[k].eq(query[k]);
              })
            )
          ).
          exec().
          then(function(res) {
            if (res && res.length) {
              console.log('retuning from cache');
              return res;
            }

            return $q.defer().promise;
          });
      });
    };

    CacheModel.prototype.httpQuery = function httpQuery(query) {
      return $http.get(urlExpMerger(this.remoteUrlExp, query));
    };

    CacheModel.prototype.query = function query(query) {
      return qAny([
          this.dbQuery(query),
          this.httpQuery(query)
      ]);
    };

    return CacheModel;
  }]).
  factory('qAny', ['$q', function($q){
    return function qAny(promises){
      var resolved;
      var deferred = $q.defer();
      promises.forEach(function(promise) {
        promise.then(resolveIfNot);
      });

      function resolveIfNot (val) {
        if (!resolved) {
          resolved = true;
          return deferred.resolve(val);
        }
      }
      return deferred.promise;
    };
  }]).
  factory('urlExpMerger', [function(){
    return function urlExpMerger(exp, values){
      var retVal = exp;
      while (match = /((?:\:)[a-z]+)/g.exec(retVal)) {
        retVal = retVal.replace(match[0], values[match[0].replace(':','')]);
      }
      return retVal;
    };
  }]);
