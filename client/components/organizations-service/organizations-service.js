(function() {

function OrganizationsService(
    $http,
    $rootScope,
    cacheModel,
    firebaseAuth,
    httpSource,
    lovefieldSource) {
  var orgsModel, lovefieldOrgs, httpOrgs;

  this.insertOrReplace = function (items) {
    return orgsModel.save(items, {singleSource: lovefieldOrgs});
  };

  this.fetch = function(options) {
    return firebaseAuth.
      githubAuth().
      then(function(authData) {
        orgsModel = cacheModel([
          lovefieldOrgs = lovefieldSource('Organizations'),
          httpOrgs = httpSource(
              'https://api.github.com/user/orgs?&access_token='+
              authData.github.accessToken)
        ]);
        return orgsModel;
      }).
      then(function(model) {
        return model.find(options);
      });
  };
}

angular.module('ghoOrganizationsService', ['ghoCacheModel', 'ghoFirebaseAuth']).
  service('Organizations', ['$http', '$rootScope', 'cacheModel', 'firebaseAuth',
      'httpSource', 'lovefieldSource', OrganizationsService]);

}());
