angular.module('ghoRepositoriesService', ['ghoDBService', 'ghoCacheModel', 'ghoFirebaseAuth']).
  service('Repositories', [
      '$http', '$rootScope', 'CacheModel', 'dbService', 'firebaseAuth',
      function($http, $rootScope, CacheModel, dbService, firebaseAuth) {
        var cacheModel;

        this.insertOrReplace = function (items) {
          console.log('repos.insertOrReplace');
          dbService.get().then(function(db) {
            var schema = db.getSchema().getRepositories();
            var repositoriesInsert = items.map(function(org){
              return schema.createRow(org);
            });
            db.insertOrReplace().into(schema).values(repositoriesInsert).exec().
              then(function(val){
                console.log(val);
              }, function(e) {
                console.error(e);
              });
          });
        };

        this.fetch = function(options) {
          return firebaseAuth.githubAuth().then(function(authData) {
            console.log('creating CacheModel');
            return new CacheModel(
              'Repositories',
              'https://api.github.com/user/repos?access_token=' +
                authData.github.accessToken);
          }).then(function(cacheModel) {
            console.log('querying CacheModel', options);
            return cacheModel.query(options);
          });
        };
  }]);
