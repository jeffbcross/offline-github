(function(){

function config($httpProvider, $routeProvider){
  $httpProvider.useApplyAsync(true);
  $routeProvider.
    when('/', {
      templateUrl: 'home.html',
      controller: 'HomeController',
      resolve: {
        auth: function(firebaseAuth) {
          return firebaseAuth.getRouteAuth();
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
      controller: 'IssuesListController',
      resolve: {
        auth: function(firebaseAuth) {
          return firebaseAuth.getRouteAuth();
        }
      }
    }).
    otherwise({
      redirectTo: '/login'
    });
}

function run($rootScope, $route, $location, $window, firebaseAuth) {
  $rootScope.$on('$loginCheckFailed', function(e) {
    var redirectPath = $window.encodeURIComponent($location.url());
    $location.url('/login?redirectTo='+redirectPath);
  });

  $rootScope.logout = function() {
    firebaseAuth.logOut();
  };
}

angular.module('ghIssuesApp', [
    'ngRoute',
    'ghoCacheModel',
    'ghoIssuesListDirective',
    'ghoIssuesService',
    'ghoFirebaseAuth',
    'ghoOrganizationsService',
    'ghoRepositoriesService'
  ]).
  config(['$httpProvider', '$routeProvider', config]).
  run(['$rootScope', '$route', '$location', '$window', 'firebaseAuth', run]);

}());
