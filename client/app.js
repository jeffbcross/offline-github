(function(){
var db;

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
        },
        db: function() {
          return getDB();
        }
      },
      reloadOnSearch: false
    }).
    otherwise({
      redirectTo: '/login'
    });
}

function getDB() {
  if (db) return db;
  return github.db.getInstance().then(function(_db){
    db = _db;
    return db;
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
    'ghoFirebaseAuth',
    'ghoIssuesListDirective',
    'ghoLovefieldQueryFactory',
    'mockIssues'

  ]).
  config(['$httpProvider', '$routeProvider', config]).
  run(['$rootScope', '$route', '$location', '$window', 'firebaseAuth', run]);

}());
