//TODO: subscription logic needs to subscribe/unsubscribe when route changes

(function() {

function IssuesListController ($location, $scope, db,
    lovefieldQueryBuilder, firebaseAuth, synchronizer) {
  var ITEMS_PER_PAGE = 30;
  var table = db.getSchema().getIssues();
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
    var storageKey = viewQuery.owner + ':' + viewQuery.repo + ':last_update';
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

    console.log('synchronizing', url);

    synchronizer.synchronize('Issues',
      {
        repository: viewQuery.repository,
          owner: viewQuery.owner
      },
      {
        defaults:'defaults'
      }, url, storageKey);
  }

  $scope.goToPrevPage = function() {
    var page = $location.search().page || 0;
    if (page > 1) {
      setPage(page-1);
    }
  };

  $scope.goToNextPage = function() {
    var page = parseInt($location.search().page, 10) || 0;
    console.log('page in goToNextPage', page);
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
    console.log('updateView');
    return fetchIssues(viewQuery).
      then(renderData).
      then(countPages).
      then(renderPageCount).
      then(syncFromWorker);
  }

  function getBaseQuery(viewQuery) {
    return Promise.resolve(db.
      select(table.number, table.id, table.comments, table.title).
      from(table).
      limit(ITEMS_PER_PAGE)).
    then(function(lfQuery) {
      viewQuery.lfQuery = lfQuery;
      return viewQuery;
    });
  }

  function paginate(viewQuery) {
    var pageNum = 0;

    if(angular.isDefined($location.search().page)) {
      pageNum = parseInt($location.search().page, 10) - 1;
    }

    if(pageNum) {
      //Skip throws if passed a zero
      viewQuery.lfQuery.skip(pageNum * ITEMS_PER_PAGE);
    }

    return viewQuery;
  }

  function orderAndPredicate(viewQuery) {
    console.log('creating predicate from', viewQuery.owner, viewQuery.repository)
    viewQuery.predicate = lovefieldQueryBuilder(table, {
      owner: viewQuery.owner,
      repository: viewQuery.repository
    });
    viewQuery.lfQuery.
      where(viewQuery.predicate).
      orderBy(table.number, lf.Order.DESC);
    return viewQuery;

  }

  function getCountQuery(viewQuery) {
    return db.
      select(lf.fn.count(table.id)).
      from(table).
      where(viewQuery.predicate);
  }

  function countPages(viewQuery) {
    return db.
      select(lf.fn.count(table.id)).
      from(table).
      where(viewQuery.predicate).
      exec().
      then(function(count) {
        viewQuery.totalCount = count;
        return viewQuery;
      });
  }

  function fetchIssues(viewQuery) {
    return getBaseQuery(viewQuery).
      then(paginate).
      then(orderAndPredicate).
      then(function() {
        return viewQuery.lfQuery.exec().then(function(issues) {
          viewQuery.issues = issues;
          return viewQuery;
        })
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

  //TODO: eventually utilize observer changes if API can provide what we need
  function updateData () {
    getBaseQuery().
      then(paginate).
      then(orderAndPredicate).
      then(function(q) {
        return q.exec();
      }).
      then(renderData).
      then(countPages).
      then(renderPageCount);

  }
}

angular.module('ghIssuesApp').
  controller(
      'IssuesListController',
      ['$location', '$scope', 'db', 'lovefieldQueryBuilder',
          'firebaseAuth', 'synchronizer', IssuesListController]);

}());
