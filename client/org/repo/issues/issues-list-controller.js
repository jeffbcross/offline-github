(function() {

function IssuesListController ($http, $location, $scope, $routeParams, db,
    issuesCacheUpdater, lovefieldQueryBuilder, mockIssues, firebaseAuth) {
  var ITEMS_PER_PAGE = 30;
  var COUNT_PROPERTY_NAME = 'COUNT(id)';
  var observeQuery;
  var table = db.getSchema().getIssues();
  var predicate = lovefieldQueryBuilder({
    repository: $routeParams.repo,
    organization: $routeParams.org
  });
  var page = parseInt($routeParams.page, 10) || 0;

  $scope.issues = [];
  $scope.$on('$locationChangeStart', updateQueryAndSubscription);

  getAndRenderIssues(db).
    then(renderData).
    then(countPages).
    then(renderPageCount).
    then(subscribeToIssues).
    then(function() {
      issuesCacheUpdater(db);
    });

  $scope.$on('$destroy', unobserve);

  $scope.prevPage = function() {
    if (page > 0) {
      setPage(page-1);
    }
  };

  $scope.nextPage = function() {
    if ($scope.pages && page < $scope.pages.length) {
      setPage(page+1);
    } else if ($scope.pages && page > $scope.pages.length - 1) {
      setPage($scope.pages.length - 1);
    }
  };

  $scope.getPage = function() {
    return page;
  };

  function setPage(num) {
    page = num;
    $location.search('page', page);
  }


  function updateQueryAndSubscription(page,state,search) {
    unobserve().
      then(getAndRenderIssues).
      then(countPages).
      then(subscribeToIssues);
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
      pageNum = parseInt($routeParams.page, 10);
    }

    if(pageNum) {
      //Skip throws if passed a zero
      query.skip(pageNum * ITEMS_PER_PAGE);
    }

    return query;
  }

  function orderAndPredicate(query) {
    return query.
      orderBy(table.number, lf.Order.DESC).
      where(predicate);
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
    return getCountQuery().exec();
  }

  function getAndRenderIssues() {
    return getBaseQuery().
      then(paginate).
      then(orderAndPredicate).
      then(function(q) {
        return q.exec();
      });
  }

  function subscribeToIssues() {
    observeQuery = db.select(
        table.number,
        table.id,
        table.comments,
        table.title).from(table).where(predicate)

    //Stay abreast of further updates
    db.observe(observeQuery, updateData);
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
    var pages = Math.ceil(count[0][COUNT_PROPERTY_NAME] / ITEMS_PER_PAGE);
    $scope.$apply(function(){
      $scope.pages=new Array(pages);
    });
  }

  //TODO: eventually utilize observer changes if API can provide what we need
  function updateData () {
    getBaseQuery().
      then(paginate).
      then(orderAndPredicate).
      exec().
      then(renderData).
      then(countPages).
      then(renderPageCount);
  }
}

function issuesCacheUpdaterFactory($http, $routeParams, firebaseAuth) {
  var db;
  var table;
  var updatedAt
  var totalAdded = 0;
  return function(_db_) {
    console.log('starting cache fetch');
    db = _db_;
    table = db.getSchema().getIssues();
    updateIssuesCache(buildUpdateUrl());
  }

  function updateIssuesCache (url) {
    $http.get(url).
      then(insertData).
      then(function(res) {
        console.log('got response', res);
        var nextPage = getNextPageUrl(res);
        if (res.data && res.data.length) {
          updatedAt = res.data[0].updated_at;
          localStorage.setItem(localKeyBuilder($routeParams.org, $routeParams.repo), updatedAt)
          console.log('set updatedAt', updatedAt);
        }

        if (nextPage) {
          updateIssuesCache(nextPage);
        }
      });
  }

  function localKeyBuilder(owner, repo) {
    return owner + ':' + repo + ':last_update';
  }

  function insertData(res) {
    totalAdded += (res && res.data && res.data.length) || 0;
    console.log('adding more data', totalAdded);
    console.log('res', res);
    var issuesInsert = res.data.map(function(issue) {
      return table.createRow(issueStorageTranslator(issue));
    });
    console.log('issuesInsert', issuesInsert)
    return db.insertOrReplace().into(table).values(issuesInsert).exec().then(function() {
      console.log('done inserting');
      return res;
    }, function(e) {
      console.log('problem inserting', e.message);
    });
  }

  function buildUpdateUrl() {
    //TODO: order by and updated since
    //TODO: store timestamp in localstorage
    var lastUpdated = localStorage.getItem(
        localKeyBuilder($routeParams.org, $routeParams.repo));
    return 'https://api.github.com/repos/'+
      $routeParams.org+
      '/'+
      $routeParams.repo+
      '/issues?'+
      'per_page=100&'+
      'state=all&'+
      'sort=updated&'+
      'direction=asc&'+
      (lastUpdated?'since='+lastUpdated+'&':'')+
      'access_token='+
      firebaseAuth.getAuth().github.accessToken;
  }

  function issueStorageTranslator(issue){
    /*jshint camelcase: false */
    var newIssue = angular.copy(issue);
    newIssue.assignee = issue.assignee || -1;
    newIssue.body = issue.body || '';
    newIssue.milestone = issue.milestone || -1;
    newIssue.created_at = new Date(issue.created_at);
    newIssue.updated_at = new Date(issue.updated_at);
    newIssue.closed_at = new Date(issue.closed_at);
    return newIssue;
  };

  function getNextPageUrl (res) {
    var linkHeader = res && res.headers('link')
    if (!linkHeader) return undefined;
    var firstLinkTuple = linkHeader.
      split(', ')[0].
      split('; rel=');
    if (firstLinkTuple[1].replace(/"/g,'') === 'next') {
      return firstLinkTuple[0].replace(/[<>]*/g, '');
    }
  }
}

angular.module('ghIssuesApp').
  factory(
      'issuesCacheUpdater',
      ['$http', '$routeParams', 'firebaseAuth',
          issuesCacheUpdaterFactory]).
  controller(
      'IssuesListController',
      ['$http', '$location', '$scope', '$routeParams', 'db',
          'issuesCacheUpdater', 'lovefieldQueryBuilder', 'mockIssues',
          'firebaseAuth', IssuesListController]);

}());
