angular.module('ghoRepositoriesService', ['ghoDBService', 'ghoCacheModel', 'ghoFirebaseAuth']).
  service('Repositories', [
              'cacheModel', 'dbService', 'firebaseAuth', 'lovefieldSource', 'httpSource',
      function(cacheModel,   dbService,   firebaseAuth,   lovefieldSource,   httpSource) {
        var model;

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
            return new cacheModel([
              lovefieldSource('Repositories'),
              httpSource('https://api.github.com/user/repos?access_token=' +
                authData.github.accessToken)
            ]);
          }).then(function(model) {
            console.log('finding repositories');
            return model.find(options);
          });
        };
  }]);
