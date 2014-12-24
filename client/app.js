var githubCredentials = JSON.parse(localStorage.getItem('github.credentials'));

angular.module('ghIssuesApp', []).
  config(['$httpProvider', function($httpProvider){
    $httpProvider.useApplyAsync(true);
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
  }]).
  service('dbService', [function() {
    var db;
    var promise = github.db.getInstance().
      then(function(database) {
        db = database;
        return db;
      });

    this.get = function () {
      if (db) return Promise.resolve(db);
      return promise;
    }
  }]).
  service('Issues', ['$http', 'dbService', function($http, dbService) {
    this.fetch = function(options) {
      if (options.firstWins) {
        return Promise.race([
          fetchFromHttp(),
          dbService.get().then(fetchFromDb)
        ]);
      }

      function fetchFromHttp() {
        return Promise.resolve($http.get(
          'https://api.github.com/repos/angular/angular.js/issues?client_id=' +
          githubCredentials.id +
          '&client_secret=' +
          githubCredentials.secret
        ));
      }

      function fetchFromDb(db) {
        return db.select().from(db.getSchema().getIssues()).exec()
          .then(function(res) {
            if (res && !res.length) {
              //Will cause Promise.race to wait for $http instead
              return new Promise(angular.noop);
            }
            return res;
          })
      }
    };
  }]).
  controller('IssuesList', [
      '$http', '$scope', 'dbService', 'issueStorageTranslator', 'Issues',
      function($http, $scope, dbService, issueStorageTranslator, Issues) {
        Issues.fetch({firstWins: true}).
          then(renderData).
          then(cacheData);

        function renderData (res) {
          var issues;
          if(res && res.data) {
            $scope.dataSource = '$http';
            issues = res.data;
          }
          else {
            $scope.dataSource = 'lovefield';
            issues = res;
          }

          $scope.$apply(function() {
            $scope.issues = issues;
          });
          return res && res.data;
        }

        function cacheData(data) {
          if (data) {
            dbService.get().then(function(db) {
              var schema = db.getSchema().getIssues();
              var issuesInsert = data.map(function(issue){
                return schema.createRow(issueStorageTranslator(issue));
              });
              db.insertOrReplace().into(schema).values(issuesInsert).exec().then(null, function(e) {
                console.error(e);
              });
            });
          }
        }
      }]);
