//TODO: subscription logic needs to subscribe/unsubscribe when route changes

(function() {

function IssuesListController ($location, $scope, db, github, issueDefaults,
    lovefieldQueryBuilder, firebaseAuth) {
  var ITEMS_PER_PAGE = 30;
  var COUNT_PROPERTY_NAME = 'COUNT(id)';

  function ViewQuery (owner, repository, page) {
    this.owner = owner;
    this.repository = repository;
    this.page = page || 0;
    this.predicate = null;
    this.lfQuery = null;
    this.issues = null;
    this.totalCount = -1;
  }

  $scope.locationSearchGetterSetter = function(key) {
    return function(val) {
      if (val === undefined) {
        return $location.search()[key];
      } else {
        $location.search(key, val);
      }
    }
  };

  $scope.issues = [];
  $scope.$on('$locationChangeStart', updateView);

  updateView();

  function syncFromWorker(viewQuery) {
    //TODO: don't sync when just the page changes, only when owner or repository
    var storageKey = viewQuery.owner + ':' + viewQuery.repository + ':last_update';
    var lastUpdated = localStorage.getItem(storageKey);
    var url = 'https://api.github.com/repos/'+
      viewQuery.owner+
      '/'+
      viewQuery.repository+
      '/issues?'+
      'per_page=100&'+
      'state=all&'+
      'sort=updated&'+
      'direction=asc&'+
      (lastUpdated?'since='+lastUpdated+'&':'')+
      'access_token='+
      firebaseAuth.getAuth().github.accessToken;


    github.synchronize({
      tableName: 'Issues',
      rawQueryPredicate: {
        repository: viewQuery.repository,
        owner: viewQuery.owner
      },
      countPropertyName: COUNT_PROPERTY_NAME,
      countColumn: 'id',
      defaults: issueDefaults(viewQuery.owner, viewQuery.repository),
      url: url,
      storageKey: storageKey
    });
  }

  $scope.goToPrevPage = function() {
    var page = $location.search().page || 1;
    if (page > 1) {
      setPage(page-1);
    }
  };

  $scope.goToNextPage = function() {
    var page = parseInt($location.search().page, 10) || 1;
    if ($scope.pages && page < $scope.pages.length) {
      setPage(page+1);
    } else if ($scope.pages && page >= $scope.pages.length) {
      setPage($scope.pages.length);
    }
  };

  $scope.getPage = function() {
    return $location.search().page;
  };

  function setPage(num) {
    $location.search('page', num);
  }

  function updateView() {
    var searchParams = $location.search();
    if (!searchParams.owner || !searchParams.repository) {
      return;
    }
    var viewQuery = new ViewQuery(searchParams.owner, searchParams.repository,
        searchParams.page);
    return fetchIssues(viewQuery).
      then(renderData).
      then(countPages).
      then(renderPageCount).
      then(syncFromWorker);
  }

  function countPages(viewQuery) {
    return github.count({
      tableName: 'Issues',
      column: 'id',
      rawQueryPredicate: {
        owner: viewQuery.owner,
        repository: viewQuery.repository
      }
    }).then(function(count) {
      viewQuery.totalCount = count;
      return viewQuery;
    })
  }

  function fetchIssues(viewQuery) {
    var queryStart = performance.now();
    return github.query({
      tableName: 'Issues',
      select: ['number', 'title', 'id', 'comments'],
      rawQueryPredicate: {
        owner: viewQuery.owner,
        repository: viewQuery.repository
      },
      orderByColumn: 'number',
      orderByDirection: 'DESC',
      limit: ITEMS_PER_PAGE,
      skip: (viewQuery.page - 1) * ITEMS_PER_PAGE
    }).then(function(issues) {
      viewQuery.issues = issues;
      return viewQuery;
    });
  }

  function showError() {
    $scope.error = 'Could not update issues from server';
  }

  function renderData(viewQuery) {
    $scope.$apply(function() {
      $scope.issues = viewQuery.issues;
    });
    return viewQuery;
  }

  function renderPageCount(viewQuery) {
    var pages;
    if (Array.isArray(viewQuery.totalCount)) {
      pages = Math.ceil(viewQuery.totalCount[0][COUNT_PROPERTY_NAME] / ITEMS_PER_PAGE);
    } else {
      pages = Math.ceil(viewQuery.totalCount / ITEMS_PER_PAGE);
    }
    $scope.$apply(function(){
      $scope.pages=new Array(pages);
    });

    return viewQuery;
  }
}

angular.module('ghIssuesApp').
  controller(
      'IssuesListController',
      ['$location', '$scope', 'db', 'github', 'issueDefaults', 'lovefieldQueryBuilder',
          'firebaseAuth', IssuesListController]);

}());
