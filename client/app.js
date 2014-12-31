var githubCredentials = JSON.parse(localStorage.getItem('github.credentials'));

angular.module('ghIssuesApp', [
    'ngRoute',
    'ghoCacheModel',
    'ghoIssuesListDirective',
    'ghoIssuesService'
  ]).
  config(['$httpProvider', '$routeProvider', function($httpProvider, $routeProvider){
    $httpProvider.useApplyAsync(true);
    $routeProvider.
      when('/', {
        templateUrl: 'home.html',
        controller: function() {

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