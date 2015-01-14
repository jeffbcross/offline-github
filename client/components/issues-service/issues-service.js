(function() {

function IssuesService(
    cacheModel,
    firebaseAuth,
    httpSource,
    issueStorageTranslator,
    lovefieldSource) {
  var issuesModel, lovefieldIssues, httpIssues;

  this.insertOrReplace = function (items) {
    return issuesModel.save(
        items.map(issueStorageTranslator),
        {singleSource: lovefieldIssues});
  };

  this.fetch = function(options) {
    return firebaseAuth.
      githubAuth().
      then(function(authData) {
        issuesModel = cacheModel([
            lovefieldIssues = lovefieldSource('Issues'),
            httpIssues = httpSource(
                'https://api.github.com/'+
                'repos/:organization/:repository/issues?access_token='+
                authData.github.accessToken)
        ]);
        return issuesModel;
      }).
      then(function(model) {
        return model.find(options);
      });
  };
}

function issueStorageTranslatorFactory(){
    return function issueStorageTranslator(issue){
      /*jshint camelcase: false */
      var newIssue = angular.copy(issue);
      newIssue.assignee = issue.assignee || -1;
      newIssue.milestone = issue.milestone || -1;
      newIssue.created_at = new Date(issue.created_at);
      newIssue.updated_at = new Date(issue.updated_at);
      return newIssue;
    };
  }

angular.module('ghoIssuesService', ['ghoCacheModel', 'ghoFirebaseAuth']).
  service('Issues', [
      'cacheModel',
      'firebaseAuth',
      'httpSource',
      'issueStorageTranslator',
      'lovefieldSource',
      IssuesService]).
  factory('issueStorageTranslator', [issueStorageTranslatorFactory]);

}());
