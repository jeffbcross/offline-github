angular.module('ghoOrganizationsService', ['ghoDBService', 'ghoCacheModel', 'ghoFirebaseAuth']).
  service('Organizations', [
      '$http', '$rootScope', 'cacheModel', 'dbService', 'firebaseAuth', 'httpSource', 'lovefieldSource',
      function($http, $rootScope, cacheModel, dbService, firebaseAuth, httpSource, lovefieldSource) {
        var orgsModel, lovefieldOrgs, httpOrgs;

        this.insertOrReplace = function (items) {
          return orgsModel.save(items, {singleSource: lovefieldOrgs});
        };

        this.fetch = function(options) {
          return firebaseAuth.
            githubAuth().
            then(function(authData) {
              return orgsModel = cacheModel([
                lovefieldOrgs = lovefieldSource('Organizations'),
                httpOrgs = httpSource('https://api.github.com/user/orgs?&access_token=' +
                  authData.github.accessToken)
              ]);
            }).
            then(function(model) {
              return model.find(options);
            });
        };
  }]);
