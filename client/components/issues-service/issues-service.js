angular.module('ghoIssuesService', ['ghoDBService', 'ghoCacheModel', 'ghoFirebaseAuth']).
  service('Issues', [
      'cacheModel',
      'dbService',
      'firebaseAuth',
      'httpSource',
      'issueStorageTranslator',
      'lovefieldSource',
      function(
          cacheModel,
          dbService,
          firebaseAuth,
          httpSource,
          issueStorageTranslator,
          lovefieldSource) {
        var issuesModel, lovefieldIssues, httpIssues;

        this.insertOrReplace = function (items) {
          return issuesModel.save(items.map(issueStorageTranslator), {singleSource: lovefieldIssues});
        };

        this.fetch = function(options) {
          return firebaseAuth.
            githubAuth().
            then(function(authData) {
              return issuesModel = cacheModel([
                  lovefieldIssues = lovefieldSource('Issues'),
                  httpIssues = httpSource(
                      'https://api.github.com/repos/:organization/:repository/issues?access_token=' +
                      authData.github.accessToken)
              ]);
            }).
            then(function(model) {
              return model.find(options);
            });
        };
  }]).
  factory('issueStorageTranslator', [function(){
    return function issueStorageTranslator(issue){
      var newIssue = angular.copy(issue);
      newIssue.assignee = issue.assignee || -1;
      newIssue.milestone = issue.milestone || -1;
      newIssue.created_at = new Date(issue.created_at);
      newIssue.updated_at = new Date(issue.updated_at);
      return newIssue;
    };
  }]);
