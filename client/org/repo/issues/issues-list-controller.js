angular.module('ghIssuesApp').
  controller('IssuesList', [
      '$scope', '$routeParams', 'Issues',
      function($scope, $routeParams, Issues) {
        Issues.fetch({
          organization: $routeParams.org,
          repository: $routeParams.repo
        }).
          then(renderData).
          then(setDataSource).
          then(cacheData);

        function renderData (res) {
          console.log('renderData', res);
          if (!res) return res;
          $scope.issues = res.data || res;
          return res;
        }

        function setDataSource(res) {
          $scope.dataSource = res && res.data ? '$http' : 'lovefield';
          return res;
        }

        function cacheData(res) {
          if (res && res.data) {
            res.data.forEach(function(data) {
              data.repository = $routeParams.repo;
              data.organization = $routeParams.org;
            });
            Issues.insertOrReplace(res.data);
          }
          return res;
        }
      }]);
