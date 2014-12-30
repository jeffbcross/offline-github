angular.module('ghoIssuesListDirective', []).
  directive('ghoIssuesList', function() {
    return {
      restrict: 'E',
      templateUrl: 'components/issues-list-directive/issues-list.html',
      scope: {
        issues: '='
      }
    }
  });
