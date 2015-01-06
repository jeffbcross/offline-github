angular.module('ghIssuesApp', [
    'ngRoute',
    'ghoCacheModel',
    'ghoIssuesListDirective',
    'ghoIssuesService',
    'ghoFirebaseAuth'
  ]).
  config(['$httpProvider', '$routeProvider', function($httpProvider, $routeProvider){
    $httpProvider.useApplyAsync(true);
    $routeProvider.
      when('/', {
        templateUrl: 'home.html',
        controller: function(auth) {
          console.log('auth info', auth);
        },
        resolve: {
          auth: function(firebaseAuth) {
            return firebaseAuth.githubAuth();
          }
        }
      }).
      when('/login', {
        templateUrl: 'login/login.html',
        controllerAs: 'ctrl',
        controller: 'LoginController'
      }).
      when('/:org', {
        template: 'organization'
      }).
      when('/:org/:repo', {
        template: 'repo'
      }).
      when('/:org/:repo/issues', {
        templateUrl: 'org/repo/issues/list.html',
        controller: 'IssuesList',
        resolve: {
          auth: function(firebaseAuth) {
            return firebaseAuth.getAuth();
          }
        }
      }).
      otherwise({
        redirectTo: '/login'
      });
  }]).
  run(['$rootScope', '$route', '$location', '$window', function($rootScope, $route, $location, $window) {
    $rootScope.$on('$loginCheckFailed', function(e) {
      console.log('loginCheckFailed');
      var redirectPath = $window.encodeURIComponent($location.url());
      $location.url('/login?redirectTo='+redirectPath);
    });
  }]);