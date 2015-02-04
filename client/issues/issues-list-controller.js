//TODO: subscription logic needs to subscribe/unsubscribe when route changes

(function() {

function filterByOrg () {
  return function(repos, org) {
    if (!org || !repos) return repos;
    return repos.filter(function(repo) {
      return repo.owner === org;
    });
  };
}

function IssuesListController ($filter, $location, $scope, github, issueDefaults,
    lovefieldQueryBuilder, firebaseAuth, paramsObservable, organizationDefaults,
    repositoryDefaults) {
  var ITEMS_PER_PAGE = 30;
  var COUNT_PROPERTY_NAME = 'COUNT(id)';
  var params = Immutable.Map($location.search());
  $scope.issues = [];
  $scope.synchronizing = {};

  var paramsObserver = paramsObservable($scope, '$locationChangeStart').
    do(function(params) {
      $scope.stateFilter = params.get('state') || 'all';
      safeDigest();
    }).
    map(function (params) {
      return params.merge({
        page: parseInt(params.get('page'), 10) || 1
      });
    });

  paramsObserver
    .distinctUntilChanged(function(params) {
      return params.get('owner')+':'+params.get('repository')+':'+params.get('state');
    })
    .map(function(params) {
      return params.filter(function(v,k) {
        //Ignore state if it's "all", since predicate should be undefined
        if (k === 'state' && v === 'all') {
          return false;
        }
        return ['page','owner','repository','state'].indexOf(k) > -1;
      })
    })
    .flatMapLatest(countPages)
    .map(function(count) {
      return count.get(0)['COUNT(id)']
    })
    .subscribe(function(numItems){
      $scope.pages = Math.ceil(numItems / ITEMS_PER_PAGE);
      safeDigest();
    });

  /**
   * Synchronize to database if owner or repository has changed
   **/
  paramsObserver
    .distinctUntilChanged(function(params) {
      return params.get('owner')+':'+params.get('repository');
    })
    .do(function(params) {
      $scope.synchronizing[params.get('owner')+params.get('repository')] = true;
      $scope.pages = undefined;
    })
    .flatMapLatest(syncFromWorker)
    .subscribe(function(evt) {
      //TODO: add something to UI with progress updates
    }, console.error.bind(console));

  /**
   * Load actual issues into view.
   **/
  paramsObserver
    .do(function () {
      $scope.loadingNewIssues = true;
      $scope.issues = [];
    })
    .flatMapLatest(function(params) {
      return fetchIssues(params);
    })
    .subscribe(function(data) {
      $scope.loadingNewIssues = false;
      $scope.issues = data.toJS();
      safeDigest();
    });

  if (params.get('owner') && params.get('repository')) {
    $scope.repository = params.get('repository');
    $scope.owner = params.get('owner');
    $scope.$emit('$locationChangeStart');
  }

  $scope.updateOrgRepo = function(organization, repository) {
    $location.search({
      owner: organization,
      repository: repository,
      page: 1
    });
  };

  $scope.goToPrevPage = function() {
    var page = $location.search().page || 1;
    if (page > 1) {
      setPage(page-1);
    }
  };

  $scope.goToNextPage = function() {
    var page = parseInt($location.search().page, 10) || 1;
    if ($scope.pages && page < $scope.pages) {
      setPage(page+1);
    } else if ($scope.pages && page >= $scope.pages) {
      setPage($scope.pages);
    }
  };

  $scope.getPage = function() {
    return $location.search().page;
  };

  function setPage(num) {
    $location.search('page', num);
  }

  function syncFromWorker(params) {
    //TODO: don't sync when just the page changes, only when owner or repository
    var storageKey = params.get('owner') + ':' + params.get('repository') + ':last_update';
    var lastUpdated = localStorage.getItem(storageKey);
    var state = params.get('state');
    var rawQueryPredicate = Immutable.Map({
      owner: params.get('owner'),
      repository: params.get('repository')
    });
    var url = 'https://api.github.com/repos/'+
      params.get('owner')+
      '/'+
      params.get('repository')+
      '/issues?'+
      'per_page=100&'+
      'state=all&'+
      'sort=updated&'+
      'direction=asc&'+
      (lastUpdated?'since='+lastUpdated+'&':'')+
      'access_token='+
      firebaseAuth.getAuth().github.accessToken;

    if (state && ['open','closed'].indexOf(state) > -1) {
      rawQueryPredicate = rawQueryPredicate.set('state', state);
    }
    return github.synchronize(Immutable.Map({
      tableName: 'Issues',
      rawQueryPredicate: rawQueryPredicate,
      countPropertyName: COUNT_PROPERTY_NAME,
      countColumn: 'id',
      defaults: issueDefaults(params.get('owner'), params.get('repository')),
      url: url,
      storageKey: storageKey
    }));
  }

  function countPages(rawQueryPredicate) {
    return github.count(Immutable.Map({
      tableName: 'Issues',
      column: 'id',
      rawQueryPredicate: rawQueryPredicate
    }));
  }

  function fetchIssues(params) {
    var skipValue = (params.get('page') - 1) * ITEMS_PER_PAGE;
    var state = params.get('state');
    var rawQueryPredicate = Immutable.Map({
      owner: params.get('owner'),
      repository: params.get('repository')
    });

    if (skipValue < 0) {
      skipValue = 0;
    }

    if (state && ['open','closed'].indexOf(state) > -1) {
      rawQueryPredicate = rawQueryPredicate.set('state', state);
    }

    return github.query(Immutable.Map({
      tableName: 'Issues',
      select: ['number', 'title', 'id', 'comments'],
      rawQueryPredicate: rawQueryPredicate,
      orderByColumn: 'number',
      orderByDirection: 'DESC',
      limit: ITEMS_PER_PAGE,
      skip: skipValue
    }));

  }

  function safeDigest() {
    if (!$scope.$$phase) {
      $scope.$digest();
    }
  }
}

angular.module('ghIssuesApp').
  controller(
      'IssuesListController',
      ['$filter', '$location', '$scope', 'github', 'issueDefaults', 'lovefieldQueryBuilder',
          'firebaseAuth', 'paramsObservable', 'organizationDefaults', 'repositoryDefaults',
          IssuesListController]).
  filter('filterByOrg', [filterByOrg]);

}());
