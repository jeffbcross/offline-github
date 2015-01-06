angular.module('ghIssuesApp', [
    'ngRoute',
    'ghoCacheModel',
    'ghoIssuesListDirective',
    'ghoIssuesService',
    'ghoFirebaseAuth',
    'ghoOrganizationsService',
    'ghoRepositoriesService'
  ]).
  config(['$httpProvider', '$routeProvider', function($httpProvider, $routeProvider){
    $httpProvider.useApplyAsync(true);
    $routeProvider.
      when('/', {
        templateUrl: 'home.html',
        controller: 'HomeController',
        resolve: {
          auth: function(firebaseAuth) {
            return firebaseAuth.getAuth();
          }
        }
      }).
      when('/login', {
        templateUrl: 'login/login.html',
        controllerAs: 'ctrl',
        controller: 'LoginController'
      }).
      when('/:org', {
        template: 'user or organization profile'
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