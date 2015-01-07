angular.module('ghoCacheModel', ['ghoDBService']).
  factory('dbQueryNormalizer', [function(){
    return function dbQueryNormalizer(schema, query){
      var normalizedQuery = [];
      for (var key in query) {
        if (query.hasOwnProperty(key) && schema[key]) {
          normalizedQuery.push(schema[key].eq(query[key]))
        }
      }
      return lf.op.and.apply(null, normalizedQuery);
    };
  }]).
  factory('postJoinMap', function() {
    return function (res, query, localTable) {
      return res.map(function(record) {
        var local = record[localTable];
        local[query.innerJoin.localColumn] = record[query.innerJoin.remoteSchema];
        return local;
      });
    }
  }).
  factory('CacheModel',
    [       '$http', '$q', 'dbService', 'dbQueryNormalizer', 'getTable', 'postJoinMap', 'urlExpMerger', 'qAny',
    function($http,   $q,   dbService,   dbQueryNormalizer,   getTable,   postJoinMap,   urlExpMerger,   qAny) {
    function CacheModel(localSchemaName, remoteUrlExp){
      this.localSchemaName = localSchemaName;
      this.remoteUrlExp = remoteUrlExp;
    };

    CacheModel.prototype.dbQuery = function dbQuery(query) {
      var self = this;
      var startTime = performance.now();
      return dbService.get().then(function(db) {
        var table = getTable(db.getSchema(), self.localSchemaName);
        var dbQuery = db.
          select().
          from(table).
          where(
            dbQueryNormalizer(table, query)
          );

        if (query && query.innerJoin) {
          var joinTable = getTable(db.getSchema(), query.innerJoin.remoteSchema);
          var remoteColumn = joinTable[query.innerJoin.remoteColumn];
          var eq = remoteColumn.eq(table[query.innerJoin.localColumn]);
          dbQuery.innerJoin(joinTable, eq);
        }
        return dbQuery.
          exec().
          then(function(res) {
            if (res && res.length) {
              if (query && query.innerJoin) {
                return postJoinMap(res, query, self.localSchemaName);
              }
              return res;
            }
            return $q.reject(res);
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
      var rejectCount = 0;
      var rejections = [];
      var deferred = $q.defer();
      promises.forEach(function(promise, i) {
        promises[i] = promise.then(resolveIfNot, function(e) {
          ignoreRejection(e, i);
        });
      });

      function resolveIfNot (val) {
        if (!resolved) {
          resolved = true;
          return deferred.resolve(val);
        }
      }

      function ignoreRejection (e, i) {
        rejections[i] = e;
        if (++rejectCount === promises.length) {
          deferred.reject(rejections);
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
