//TODO: subscription logic needs to subscribe/unsubscribe when route changes

(function() {

function IssuesListController ($location, $scope, $routeParams, db,
    lovefieldQueryBuilder, firebaseAuth) {
  var ITEMS_PER_PAGE = 30;
  var observeQuery;
  var table = db.getSchema().getIssues();
  var predicate = lovefieldQueryBuilder(table, {
    repository: $routeParams.repo,
    owner: $routeParams.org
  });
  var COUNT_PROPERTY_NAME = 'COUNT(id)';
  var page = parseInt($routeParams.page, 10) || 1;

  var worker = new Worker('issues-synchronizer.js');
  worker.onmessage = function(msg) {
  }

  worker.onmessage = function(e) {
    switch (e.data.operation) {
      case 'localStorage.getItem':
        worker.postMessage({
          operation: 'localStorage.getItem',
          result: localStorage.getItem(e.data.key),
          key: e.data.key
        });
        break;
      case 'localStorage.setItem':
        localStorage.setItem(e.data.key, e.data.payload);
        break;
      case 'firebaseAuth.getAuth':
        worker.postMessage({
          operation: 'firebaseAuth.getAuth',
          auth: firebaseAuth.getAuth()
        });
        break;
      case 'count.update':
        if (e.data.query.owner === $routeParams.org &&
            e.data.query.repository === $routeParams.repo) {
          renderPageCount(e.data.count);
        }

        break;
    }
  }

  $scope.issues = [];
  $scope.$on('$locationChangeStart', reFetchIssues);

  fetchIssues(db).
    then(renderData).
    then(countPages).
    then(renderPageCount).
    then(syncFromWorker);

  function syncFromWorker() {
    worker.postMessage({
      operation: 'sync.read',
      query: {
        repository: $routeParams.repo,
        owner: $routeParams.org
      }
    });
  }

  $scope.goToPrevPage = function() {
    if (page > 1) {
      setPage(page-1);
    }
  };

  $scope.goToNextPage = function() {
    if ($scope.pages && page < $scope.pages.length) {
      setPage(page+1);
    } else if ($scope.pages && page >= $scope.pages.length) {
      setPage($scope.pages.length);
    }
  };

  $scope.getPage = function() {
    return page;
  };

  function setPage(num) {
    page = num;
    $location.search('page', page);
  }

  function reFetchIssues(page) {
    fetchIssues().
      then(renderData).
      then(countPages).
      then(renderPageCount).
      then(syncFromWorker);
  }

  function getBaseQuery() {
    return Promise.resolve(db.
      select(table.number, table.id, table.comments, table.title).
      from(table).
      limit(ITEMS_PER_PAGE));
  }

  function paginate(query) {
    var pageNum = 0;

    if(angular.isDefined($routeParams.page)) {
      pageNum = parseInt($routeParams.page, 10) - 1;
    }

    if(pageNum) {
      //Skip throws if passed a zero
      query.skip(pageNum * ITEMS_PER_PAGE);
    }

    return query;
  }

  function orderAndPredicate(query) {
    return query.
      where(predicate).
      orderBy(table.number, lf.Order.DESC);

  }

  function getCountQuery() {
    return db.
      select(lf.fn.count(table.id)).
      from(table).
      where(predicate);
  }

  function unobserve () {
    if (observeQuery) {
      db.unobserve(observeQuery, updateData);
      observeQuery = null;
    }
    return Promise.resolve(db);
  }

  function countPages() {
    return getCountQuery().exec().then(logAndReturn);
  }

  function fetchIssues() {
    return getBaseQuery().
      then(paginate).
      then(orderAndPredicate).
      then(function(q) {
        return q.exec();
      });
  }

  function logAndReturn (input) {
    return input
  }

  function subscribeToIssues() {
    observeQuery = db.select(
        table.number,
        table.id,
        table.comments,
        table.title).from(table).where(predicate)

    //Stay abreast of further updates
    // db.observe(observeQuery, updateData);
  }

  function showError() {
    $scope.error = 'Could not update issues from server';
  }

  function renderData(issues) {
    $scope.$apply(function() {
      $scope.issues = issues;
    });
  }

  function renderPageCount(count) {

    var pages;
    if (Array.isArray(count)) {
      pages = Math.ceil(count[0][COUNT_PROPERTY_NAME] / ITEMS_PER_PAGE);
    } else {
      pages = Math.ceil(count / ITEMS_PER_PAGE);
    }
    $scope.$apply(function(){
      $scope.pages=new Array(pages);
    });
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
      ['$location', '$scope', '$routeParams', 'db', 'lovefieldQueryBuilder',
          'firebaseAuth', IssuesListController]);

}());
