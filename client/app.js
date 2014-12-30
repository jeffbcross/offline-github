var githubCredentials = JSON.parse(localStorage.getItem('github.credentials'));

angular.module('ghIssuesApp', [
    'ghoIssuesListDirective',
    'ghoIssuesService'
  ]).
  config(['$httpProvider', function($httpProvider){
    $httpProvider.useApplyAsync(true);
  }]).
  controller('IssuesList', [
      '$scope', 'Issues',
      function($scope, Issues) {
        Issues.fetch({firstWins: true}).
          then(renderData).
          then(setDataSource).
          then(cacheData);

        function renderData (res) {
          if (!res) return res;
          $scope.$apply(function() {
            $scope.issues = res.data || res;
          });
          return res;
        }

        function setDataSource(res) {
          $scope.dataSource = res && res.data ? '$http' : 'lovefield';
          return res;
        }

        function cacheData(res) {
          if (res && res.data) {
            Issues.insertOrReplace(res.data);
          }
          return res;
        }
      }]);
