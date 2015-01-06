angular.module('ghIssuesApp').
  controller('LoginController', ['$scope', 'firebaseAuth', function($scope, firebaseAuth){
    this.login = function() {
      firebaseAuth.
        githubAuth().
        then(this.redirectOnSuccess, this.loginFailed);
    };

    this.loginFailed = function loginFailed(e) {
      $scope.error = e;
    };

    this.redirectOnSuccess = function redirectOnSuccess() {
      $location.url(decodeURIComponent($location.search().redirectTo));
    };
  }]);
