angular.module('ghIssuesApp').
  controller('HomeController', ['$scope', 'auth', 'Repositories', function($scope, auth, Repositories) {
        Repositories.fetch().
          then(renderData).
          then(setDataSource)/*.
          then(cacheData);*/

        function renderData (res) {
          if (!res) return res;
          $scope.repositories = res.data || res;
          return res;
        }

        function setDataSource(res) {
          $scope.dataSource = res && res.data ? '$http' : 'lovefield';
          return res;
        }

        function cacheData(res) {
          if (res && res.data) {
            console.log('TODO: insertOrReplace Repositories');
            // Repositories.insertOrReplace(res.data);
          }
          return res;
        }
      }]);
