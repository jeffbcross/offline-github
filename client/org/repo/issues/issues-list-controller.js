angular.module('ghIssuesApp').
  controller('IssuesList', [
      '$scope', '$routeParams', 'Issues',
      function($scope, $routeParams, Issues) {
        Issues.fetch({
          organization: $routeParams.org,
          repository: $routeParams.repo
        }).
          then(renderData).
          then(cacheData);

        function renderData (res) {
          if (!res) return res;
          $scope.issues = res.data || res;
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
