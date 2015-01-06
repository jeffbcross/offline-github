angular.module('ghoOrganizationsService', ['ghoDBService', 'ghoCacheModel', 'ghoFirebaseAuth']).
  service('Organizations', [
      '$http', '$rootScope', 'CacheModel', 'dbService', 'firebaseAuth',
      function($http, $rootScope, CacheModel, dbService, firebaseAuth) {
        var cacheModel;

        this.insertOrReplace = function (items) {
          dbService.get().then(function(db) {
            var schema = db.getSchema().getOrganizations();
            var orgsInsert = items.map(function(org){
              return schema.createRow(org);
            });
            db.insertOrReplace().into(schema).values(orgsInsert).exec().
              then(function(val){
                console.log(val);
              }, function(e) {
                console.error(e);
              });
          });
        };

        this.fetch = function(options) {
          return firebaseAuth.githubAuth().then(function(authData) {
            return new CacheModel(
              'Organizations',
              'https://api.github.com/user/orgs?access_token=' +
                authData.github.accessToken);
          }).then(function(cacheModel) {
            return cacheModel.query(options);
          });
        };
  }]);
