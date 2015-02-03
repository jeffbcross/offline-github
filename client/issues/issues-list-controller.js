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
  var params = $location.search();
  $scope.issues = [];
  $scope.synchronizing = {};

  var paramsObserver = paramsObservable($scope, '$locationChangeStart').
    map(function (param) {
      return {
        owner: param.owner,
        repository: param.repository,
        page: parseInt(param.page, 10) || 1,
        totalCount: -1
      };
    });

  /**
   * Synchronize and keep total page counter up to date.
   **/
  paramsObserver
    .do(function(data) {
      $scope.synchronizing[data.owner+data.repository] = true;
    })
    .flatMapLatest(function(latest) {
      return syncFromWorker(latest);
    })
    .flatMapLatest(function(data) {
      return countPages(data.rawQueryPredicate);
    })
    .map(function(count){
      return count[0]['COUNT(id)']
    })
    .subscribe(function(numItems) {
      $scope.$apply(function() {
        $scope.pages = new Array(Math.ceil(numItems / ITEMS_PER_PAGE));
      });
    }, console.error.bind(console));

  /**
   * Load actual issues into view.
   **/
  paramsObserver
    .do(function (data) {
      $scope.loadingNewIssues = true;
      $scope.issues = [];
    })
    .flatMapLatest(function(latest) {
      return fetchIssues(latest);
    })
    .subscribe(function (data) {
      $scope.loadingNewIssues = false;
      $scope.issues = data;
      $scope.$digest();
    });

  if (params.owner && params.repository) {
    $scope.repository = params.repository;
    $scope.owner = params.owner;
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

  function syncFromWorker(issuesQuery) {
    //TODO: don't sync when just the page changes, only when owner or repository
    var storageKey = issuesQuery.owner + ':' + issuesQuery.repository + ':last_update';
    var lastUpdated = localStorage.getItem(storageKey);
    var url = 'https://api.github.com/repos/'+
      issuesQuery.owner+
      '/'+
      issuesQuery.repository+
      '/issues?'+
      'per_page=100&'+
      'state=all&'+
      'sort=updated&'+
      'direction=asc&'+
      (lastUpdated?'since='+lastUpdated+'&':'')+
      'access_token='+
      firebaseAuth.getAuth().github.accessToken;


    return github.synchronize({
      tableName: 'Issues',
      rawQueryPredicate: {
        repository: issuesQuery.repository,
        owner: issuesQuery.owner
      },
      countPropertyName: COUNT_PROPERTY_NAME,
      countColumn: 'id',
      defaults: issueDefaults(issuesQuery.owner, issuesQuery.repository),
      url: url,
      storageKey: storageKey
    });
  }

  function countPages(issuesQuery) {
    return github.count({
      tableName: 'Issues',
      column: 'id',
      rawQueryPredicate: {
        owner: issuesQuery.owner,
        repository: issuesQuery.repository
      }
    });
  }

  function fetchIssues(issuesQuery) {
    var skipValue = (issuesQuery.page - 1) * ITEMS_PER_PAGE;
    var query;
    if (skipValue < 0) {
      skipValue = 0;
    }

    query = {
      tableName: 'Issues',
      select: ['number', 'title', 'id', 'comments'],
      rawQueryPredicate: {
        owner: issuesQuery.owner,
        repository: issuesQuery.repository
      },
      orderByColumn: 'number',
      orderByDirection: 'DESC',
      limit: ITEMS_PER_PAGE,
      skip: skipValue
    }

    return github.query(query);

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
