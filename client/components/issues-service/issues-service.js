angular.module('ghoIssuesService', ['ghoDBService', 'ghoCacheModel']).
  service('Issues', [
      '$http', 'CacheModel', 'dbService', 'issueStorageTranslator',
      function($http, CacheModel, dbService, issueStorageTranslator) {
        var cacheModel = new CacheModel(
            'Issues',
            'https://api.github.com/repos/:organization/:repository/issues?client_id=' +
              githubCredentials.id +
              '&client_secret=' +
              githubCredentials.secret);

        this.insertOrReplace = function (items) {
          dbService.get().then(function(db) {
            var schema = db.getSchema().getIssues();
            var issuesInsert = items.map(function(issue){
              return schema.createRow(issueStorageTranslator(issue));
            });
            db.insertOrReplace().into(schema).values(issuesInsert).exec().
              then(function(val){
                console.log(val);
              }, function(e) {
                console.error(e);
              });
          });
        };

        this.fetch = function(options) {
          return cacheModel.query(options);
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
