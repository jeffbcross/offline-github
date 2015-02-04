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
    map(function (params) {
      return params.merge({
        page: parseInt(params.get('page'), 10) || 1,
        totalCount: -1
      });
    });

  /**
   * Synchronize and keep total page counter up to date.
   **/
  paramsObserver
    .do(function(params) {
      $scope.synchronizing[params.get('owner')+params.get('repository')] = true;
    })
    .flatMapLatest(function(params) {
      return syncFromWorker(params);
    })
    .flatMapLatest(function(query) {
      return countPages(query.get('rawQueryPredicate'));
    })
    .map(function(count){
      return count.get(0)['COUNT(id)']
    })
    .subscribe(function(numItems) {
      $scope.$apply(function() {
        $scope.pages = Math.ceil(numItems / ITEMS_PER_PAGE);
      });
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
      $scope.$digest();
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


    return github.synchronize(Immutable.Map({
      tableName: 'Issues',
      rawQueryPredicate: {
        repository: params.get('repository'),
        owner: params.get('owner')
      },
      countPropertyName: COUNT_PROPERTY_NAME,
      countColumn: 'id',
      defaults: issueDefaults(params.get('owner'), params.get('repository')),
      url: url,
      storageKey: storageKey
    }));
  }

  function countPages(issuesQuery) {
    return github.count(Immutable.Map({
      tableName: 'Issues',
      column: 'id',
      rawQueryPredicate: {
        owner: issuesQuery.owner,
        repository: issuesQuery.repository
      }
    }));
  }

  function fetchIssues(params) {
    var skipValue = (params.get('page') - 1) * ITEMS_PER_PAGE;
    if (skipValue < 0) {
      skipValue = 0;
    }

    return github.query(Immutable.Map({
      tableName: 'Issues',
      select: ['number', 'title', 'id', 'comments'],
      rawQueryPredicate: {
        owner: params.get('owner'),
        repository: params.get('repository')
      },
      orderByColumn: 'number',
      orderByDirection: 'DESC',
      limit: ITEMS_PER_PAGE,
      skip: skipValue
    }));

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
