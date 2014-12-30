angular.module('ghoIssuesService', ['ghoDBService']).
  service('Issues', [
      '$http', 'dbService', 'issueStorageTranslator',
      function($http, dbService, issueStorageTranslator) {
        this.insertOrReplace = function (items) {
          console.log('insertOrReplace items', items)
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
          if (options.firstWins) {
            return Promise.race([
              fetchFromHttp(),
              dbService.get().then(fetchFromDb)
            ]);
          }

          function fetchFromHttp() {
            // return new Promise(angular.noop)
            return Promise.resolve($http.get(
              'https://api.github.com/repos/' + options.org + '/' + options.repo + '/issues?client_id=' +
              githubCredentials.id +
              '&client_secret=' +
              githubCredentials.secret
            ));
          }

          function fetchFromDb(db) {
            var issues = db.getSchema().getIssues();
            return db.select().
              from(issues).
              where(issues.organization.eq(options.org), issues.repository.eq(options.repo)).
              exec()
                .then(function(res) {
                  console.log('result', res);
                  if (res && !res.length) {
                    //Will cause Promise.race to wait for $http instead
                    return new Promise(angular.noop);
                  }
                  return res;
                });
          }
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
