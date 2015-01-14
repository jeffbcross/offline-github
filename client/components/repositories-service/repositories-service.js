(function() {

function RepositoriesService(
    cacheModel,
    firebaseAuth,
    lovefieldSource,
    httpSource) {
  var reposModel, lovefieldRepos, httpRepos;

  this.insertOrReplace = function (items) {
    return reposModel.save(items, {singleSource: lovefieldRepos});
  };

  this.fetch = function(options) {
    return firebaseAuth.
      githubAuth().
      then(function(authData) {
        return new cacheModel([
          lovefieldRepos = lovefieldSource('Repositories'),
          httpRepos = httpSource(
              'https://api.github.com/user/repos?access_token=' +
              authData.github.accessToken)
        ]);
      }).
      then(function(model) {
        return model.find(options);
      });
  };
}

angular.module('ghoRepositoriesService', ['ghoCacheModel', 'ghoFirebaseAuth']).
  service('Repositories', ['cacheModel', 'firebaseAuth', 'lovefieldSource',
      'httpSource', RepositoriesService]);

}());
