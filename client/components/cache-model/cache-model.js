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
  factory('httpSource', ['$http', 'urlExpMerger', function($http, urlExpMerger) {
    function HttpSource (urlExp) {
      this.remoteUrlExp = urlExp;
    }

    HttpSource.prototype.find = function (query) {
      var self = this;
      return new Promise(function(resolve, reject) {
        var resolvedUrl = urlExpMerger(self.remoteUrlExp, query);
        $http.get(resolvedUrl).then(resolve, reject);
      });
    }

    return function (urlExp) {
      return new HttpSource(urlExp);
    }
  }]).
  factory('lovefieldSource',
    [       '$q', 'dbService', 'dbQueryNormalizer', 'getTable',
    function($q,   dbService,   dbQueryNormalizer,   getTable) {
      function LovefieldSource(modelName) {
        this.localSchemaName = modelName;
      }

      LovefieldSource.prototype.find = function(query) {
        var self = this;
        return dbService.get().then(function(db) {
          var table = getTable(db.getSchema(), self.localSchemaName);
          var dbQuery = db.
            select().
            from(table).
            where(
              dbQueryNormalizer(table, query)
            );
          return dbQuery.
            exec().
            then(function(res) {
              if (res && res.length) {
                return res;
              }
              return new Promise(angular.noop);
            });
        });
      };

      return function lovefieldSource(opts){
        return new LovefieldSource(opts);
      };
  }]).
  factory('cacheModel', [function() {
    function CacheModel(sources) {
      if (!Array.isArray(sources)) {
        throw new Error('CacheModel cannot be instantiated with a sources array');
      }
      this.sources = sources;
    };

    CacheModel.prototype.find = function(query) {
      //Cheap algorithm to return the first availabe results
      var sourceResults = this.sources.map(function(source) {
        return source.find(query);
      });
      return Promise.race(sourceResults);
    };

    return function (sources) {
      return new CacheModel(sources);
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
