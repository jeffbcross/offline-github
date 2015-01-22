(function() {

function ghoIssuesListDirective() {
  return {
    restrict: 'E',
    templateUrl: 'components/issues-list-directive/issues-list.html',
    scope: {
      issues: '=',
      error: '=',
      page: '@',
      limit: '@'
    },
    link: function(scope) {
      scope.limit = scope.limit || 25;
      scope.page = scope.page || 0;
    }
  };
}

function pageFilter() {
  return function(val, index, limit) {
    if (!val || !val.slice) {
      return val;
    }
    return val.slice(index * limit, (index * limit) + 25);
  };
}

function pagesFilter() {
  return function (val, limit) {
    if (!val || !val.length) {
      return [];
    }
    return new Array(Math.ceil(val.length / limit));
  };
}

angular.module('ghoIssuesListDirective', []).
  directive('ghoIssuesList', [ghoIssuesListDirective]).
  filter('page', [pageFilter]).
  filter('pages', [pagesFilter]);

}());
