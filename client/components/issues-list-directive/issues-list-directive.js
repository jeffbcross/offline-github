angular.module('ghoIssuesListDirective', []).
  directive('ghoIssuesList', function() {
    return {
      restrict: 'E',
      templateUrl: 'components/issues-list-directive/issues-list.html',
      scope: {
        issues: '=',
        page: '@',
        limit: '@'
      },
      link: function(scope) {
        scope.limit = scope.limit || 25;
        scope.page = scope.page || 0;
      }
    };
  }).
  filter('page', function() {
    return function(val, index, limit) {
      if (!val || !val.slice) return val;
      return val.slice(index * limit, (index * limit) + 25);
    };
  }).
  filter('pages', function() {
    return function (val, limit) {
      if (!val || !val.length) return [];
      return new Array(Math.ceil(val.length / limit));
    };
  });
