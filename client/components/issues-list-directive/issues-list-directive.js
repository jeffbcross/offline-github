(function() {

function ghoIssuesListDirective($location, $routeParams) {
  return {
    restrict: 'E',
    templateUrl: 'components/issues-list-directive/issues-list.html',
    scope: {
      issues: '=',
      error: '=',
      pages: '=',
      limit: '@'
    },
    link: function(scope) {
      var page = $routeParams.page || 0;
      scope.$watch('page', function(newVal, oldVal) {
        if (typeof oldVal === 'undefined' || newVal === oldVal) {
          return;
        }
      });

      scope.getPage = function() {
        return page;
      };

      scope.setPage = function(num) {
        page = num;
        $location.search('page', page);
      }
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
  directive('ghoIssuesList', ['$location', '$routeParams',
      ghoIssuesListDirective]).
  filter('page', [pageFilter]).
  filter('pages', [pagesFilter]);

}());
