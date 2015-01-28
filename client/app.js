(function(){
var db;

function config($httpProvider, $routeProvider){
  $httpProvider.useApplyAsync(true);
  $routeProvider.
    when('/login', {
      templateUrl: 'login/login.html',
      controllerAs: 'ctrl',
      controller: 'LoginController'
    }).
    when('/issues', {
      templateUrl: 'issues/list.html',
      controller: 'IssuesListController',
      resolve: {
        auth: function(firebaseAuth) {
          return firebaseAuth.getRouteAuth();
        },
        db: function(github) {
          return github.whenDbLoaded();
        }
      },
      reloadOnSearch: false
    }).
    otherwise({
      redirectTo: '/issues'
    });
}

function getDB() {
  if (db) return db;
  return github.db.getInstance().then(function(_db){
    db = _db;
    console.log('returning instance');
    return db;
  }, function(e) {
    console.log('error loading database', e.stack);
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
    'ghoGithubService',
    'ghoIssueDefaultsFactory',
    'ghoLovefieldQueryFactory',
    'ghoSynchronizationService'
  ]).
  config(['$httpProvider', '$routeProvider', config]).
  run(['$rootScope', '$route', '$location', '$window', 'firebaseAuth', run]);

}());
