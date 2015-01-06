angular.module('ghIssuesApp').
  controller('HomeController', ['$scope', 'auth', 'Repositories', function($scope, auth, Repositories) {
        Repositories.fetch().
          then(renderData).
          then(setDataSource).
          then(cacheData);

        if (auth && auth.github) $scope.loggedInUser = auth.github.username;

        function renderData (res) {
          if (!res) return res;
          $scope.repositories = res.data || res;
          $scope.owners = $scope.repositories.reduce(function(prev, repo) {
            prev[repo.owner.login] = repo.owner;
            return prev;
          }, {});
          return res;
        }

        function setDataSource(res) {
          $scope.dataSource = res && res.data ? '$http' : 'lovefield';
          return res;
        }

        function cacheData(res) {
          if (res && res.data) {
            //TODO: cache this after dealing with non-nullables
            // Repositories.insertOrReplace(res.data);
          }
          return res;
        }
      }]).
      filter('meFirst', function() {
        return function (users,loggedInUser) {
          var newUsers = [];
          if(!users) return newUsers;
          Object.keys(users).forEach(function(login) {
            newUsers[login === loggedInUser? 'unshift':'push'](users[login]);
          });
          return newUsers;
        };
      });
