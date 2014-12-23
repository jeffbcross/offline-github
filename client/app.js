var githubCredentials = JSON.parse(localStorage.getItem('github.credentials'));

function issueStorageTranslator (issue) {
  var newIssue = angular.copy(issue);
  newIssue.assignee = issue.assignee || -1;
  newIssue.milestone = issue.milestone || -1;
  newIssue.created_at = new Date(issue.created_at);
  newIssue.updated_at = new Date(issue.updated_at);
  return newIssue;
}

var db;
github.db.getInstance().then(function(database) {
  db = database;
});

angular.module('ghIssuesApp', []).
  config(['$httpProvider', function($httpProvider){
    $httpProvider.useApplyAsync(true);
  }]).
  controller('IssuesList', ['$http', '$scope', function($http, $scope) {
    Promise.race([
      Promise.resolve($http.get(
        'https://api.github.com/repos/angular/angular.js/issues?client_id=' +
        githubCredentials.id +
        '&client_secret=' +
        githubCredentials.secret
      )),
      github.db.getInstance().
        then(function(db) {
          return db.select().from(db.getSchema().getIssues()).exec();
        }).then(function(res) {
          if (res && !res.length) {
            //Throwing will cause Promise.race to wait for $http instead
            throw new Error('nothing cached, wait for http');
          }
          return res
        })
    ])
    .then(function(res) {
      var issues;
      if(res && res.data) {
        $scope.dataSource = '$http';
        issues = res.data;
        var schema = db.getSchema().getIssues();
        var issuesInsert = issues.map(function(issue){
          return schema.createRow(issueStorageTranslator(issue));
        });
        db.insertOrReplace().into(schema).values(issuesInsert).exec().then(null, function(e) {
          console.error(e);
        })
      }
      else {
        $scope.dataSource = 'lovefield';
        issues = res;
      }

      $scope.$apply(function() {
        $scope.issues = issues;
      });
    });
  }]);
