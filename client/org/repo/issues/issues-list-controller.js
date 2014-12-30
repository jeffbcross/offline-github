angular.module('ghIssuesApp').
  controller('IssuesList', [
      '$scope', '$routeParams', 'Issues',
      function($scope, $routeParams, Issues) {
        Issues.fetch({
          org: $routeParams.org,
          firstWins: true,
          repo: $routeParams.repo
        }).
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
