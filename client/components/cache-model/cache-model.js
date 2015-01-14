/* global lf */

(function() {

function dbQueryNormalizerFactory(){
  return function dbQueryNormalizer(schema, query){
    var normalizedQuery = [];
    for (var key in query) {
      if (query.hasOwnProperty(key) && schema[key]) {
        normalizedQuery.push(schema[key].eq(query[key]));
      }
    }
    return lf.op.and.apply(null, normalizedQuery);
  };
}

function httpSourceFactory($http, urlExpMerger) {
  function HttpSource (urlExp) {
    this.remoteUrlExp = urlExp;
  }

  HttpSource.prototype.find = function (query) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var resolvedUrl = urlExpMerger(self.remoteUrlExp, query);
      $http.get(resolvedUrl).then(resolve, reject);
    });
  };

  //TODO: Needs real implementation with some thought.
  HttpSource.prototype.save = function (items, options) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var resolvedUrl = urlExpMerger(self.remoteUrlExp, options);
      $http.put(resolvedUrl, items).then(resolve, reject);
    });
  };

  return function (urlExp) {
    return new HttpSource(urlExp);
  };
}

function lovefieldSourceFactory($q,   db,   dbQueryNormalizer,   getTable) {
  function LovefieldSource(modelName) {
    this.localSchemaName = modelName;
  }

  LovefieldSource.prototype.find = function(query) {
    var self = this;
    return db.get().then(function(db) {
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

  LovefieldSource.prototype.save = function(items) {
    var self = this;
    return db.get().then(function(db) {
        var table = getTable(db.getSchema(), self.localSchemaName);
        var issuesInsert = items.map(function(item){
          return table.createRow(item);
        });
        return db.insertOrReplace().into(table).values(issuesInsert).exec();
      });
  };

  return function lovefieldSource(opts){
    return new LovefieldSource(opts);
  };
}

function cacheModelFactory() {
  function CacheModel(sources) {
    if (!Array.isArray(sources)) {
      throw new Error('CacheModel cannot be instantiated with a sources array');
    }
    this.sources = sources;
  }

  CacheModel.prototype.find = function(query) {
    //Cheap algorithm to return the first availabe results
    var sourceResults = this.sources.map(function(source) {
      return source.find(query);
    });
    return Promise.race(sourceResults);
  };

  CacheModel.prototype.save = function(items, options) {
    var sourceResults = this.sources.
      filter(function(source) {
        if (options && options.singleSource) {
          return source === options.singleSource;
        }
        return true;
      }).
      map(function(source) {
        return source.save(items);
      });
    return Promise.all(sourceResults);
  };

  return function (sources) {
    return new CacheModel(sources);
  };
}

function urlExpMergerFactory() {
  return function urlExpMerger(exp, values){
    var retVal = exp, match;
    while ((match = /((?:\:)[a-z]+)/g.exec(retVal))) {
      retVal = retVal.replace(match[0], values[match[0].replace(':','')]);
    }
    return retVal;
  };
}

angular.module('ghoCacheModel', []).
  factory('dbQueryNormalizer', [dbQueryNormalizerFactory]).
  factory('httpSource', ['$http', 'urlExpMerger', httpSourceFactory]).
  factory(
      'lovefieldSource',
      ['$q', 'db', 'dbQueryNormalizer', 'getTable',
          lovefieldSourceFactory]).
  factory('cacheModel', [cacheModelFactory]).
  factory('urlExpMerger', [urlExpMergerFactory]);

}());
