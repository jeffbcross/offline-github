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
      when('/:org', {
        template: 'organization'
      }).
      when('/:org/:repo', {
        template: 'repo'
      }).
      when('/:org/:repo/issues', {
        templateUrl: 'org/repo/issues/list.html',
        controller: 'IssuesList'
      })
  }]);