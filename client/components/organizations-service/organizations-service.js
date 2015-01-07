angular.module('ghoOrganizationsService', ['ghoDBService', 'ghoCacheModel', 'ghoFirebaseAuth']).
  service('Organizations', [
      '$http', '$rootScope', 'cacheModel', 'dbService', 'firebaseAuth', 'httpSource', 'lovefieldSource',
      function($http, $rootScope, cacheModel, dbService, firebaseAuth, httpSource, lovefieldSource) {
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
            return cacheModel([
              lovefieldSource('Organizations'),
              httpSource('https://api.github.com/user/orgs?per_page=100&access_token=' +
                authData.github.accessToken)
            ]);
          }).then(function(model) {
            return model.find(options);
          });
        };
  }]);
