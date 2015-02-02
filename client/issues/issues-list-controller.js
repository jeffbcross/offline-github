//TODO: subscription logic needs to subscribe/unsubscribe when route changes

(function() {

function filterByOrg () {
  return function(repos, org) {
    console.log(org);
    if (!org || !repos) return repos;
    return repos.filter(function(repo) {
      return repo.owner === org;
    });
  };
}

function IssuesListController ($filter, $location, $scope, github, issueDefaults,
    lovefieldQueryBuilder, firebaseAuth, organizationDefaults, repositoryDefaults) {
  var ITEMS_PER_PAGE = 30;
  var COUNT_PROPERTY_NAME = 'COUNT(id)';
  var params = $location.search();
  $scope.issues = [];

  if (params.owner && params.repository) {
    $scope.repository = params.repository;
    $scope.owner = params.owner;
    console.log('set owner and repository', $scope.owner, $scope.repository);
    updateView(new IssuesQuery(params.owner, params.repository, params.page));
  }



  $scope.$on('$locationChangeStart', function(e) {
    var params = $location.search();
    updateView(new IssuesQuery(params.owner, params.repository, params.page));
  });

  $scope.updateOrgRepo = function(organization, repository) {
    console.log('updateOrgRepo', organization, repository);
    $location.search({
      owner: organization,
      repository: repository,
      page: 1
    });
  };

  getRepositories();
  getOrganizations();

  function IssuesQuery (owner, repository, page) {
    this.owner = owner;
    this.repository = repository;
    this.page = page || 1;
    this.predicate = null;
    this.lfQuery = null;
    this.issues = null;
    this.totalCount = -1;
  }

  function getRepositories() {
    github.query({
      tableName: 'Organizations',
      select: ['id','login']
    }).
    then(function(organizations) {
      $scope.$apply(function(){
        $scope.organizations = organizations;
      });

    }).
    then(syncOrganizations);
  }

  function getOrganizations() {
    github.query({
      tableName: 'Repositories',
      select: ['id','owner','name']
    }).
    then(function(repositories) {
      $scope.$apply(function(){
        $scope.repositories = repositories;
      });

    }).
    then(syncRepositories);
  }

  function syncOrganizations() {
    return new Promise(function(resolve, reject) {
      //TODO: only get repositories for user and organizations that user belongs to

      var storageKey = 'Organizations:last_update';
      var lastUpdated = localStorage.getItem(storageKey);
      var url = 'https://api.github.com/user/orgs?'+
        'per_page=100&'+
        'sort=updated&'+
        'direction=asc&'+
        (lastUpdated?'since='+lastUpdated+'&':'')+
        'access_token='+
        firebaseAuth.getAuth().github.accessToken;

      github.synchronize({
        tableName: 'Organizations',
        rawQueryPredicate: {},
        countPropertyName: COUNT_PROPERTY_NAME,
        countColumn: 'id',
        defaults: organizationDefaults(),
        url: url,
        storageKey: storageKey
      }).subscribe(console.log.bind(console), reject, resolve);
    });
  }

  function syncRepositories() {
    return new Promise(function(resolve, reject) {
      github.query({
        tableName: 'Organizations',
        select: ['login']
      }).
      then(function(organizations) {

        return Promise.all(organizations.map(function(organization) {
          return new Promise(function(resolve, reject) {
            var storageKey = organization.login+':Repositories:last_update';
            var lastUpdated = localStorage.getItem(storageKey);
            var url = 'https://api.github.com/orgs/'+
              organization.login+
              '/repos?'+
              'per_page=100&'+
              'sort=updated&'+
              'direction=asc&'+
              (lastUpdated?'since='+lastUpdated+'&':'')+
              'access_token='+
              firebaseAuth.getAuth().github.accessToken;

            github.synchronize({
              tableName: 'Repositories',
              rawQueryPredicate: {},
              countPropertyName: COUNT_PROPERTY_NAME,
              countColumn: 'id',
              defaults: repositoryDefaults(),
              url: url,
              storageKey: storageKey
            }).subscribe(console.log.bind(console), reject, resolve);
          })
        }));
      })
    });
  }

  function syncFromWorker(issuesQuery) {
    console.log('syncFromWorker', issuesQuery);
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


    github.synchronize({
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

  function updateView(issuesQuery) {
    return fetchIssues(issuesQuery).
      then(renderData).
      then(countPages).
      then(renderPageCount).
      then(syncFromWorker);
  }

  function countPages(issuesQuery) {
    return github.count({
      tableName: 'Issues',
      column: 'id',
      rawQueryPredicate: {
        owner: issuesQuery.owner,
        repository: issuesQuery.repository
      }
    }).then(function(count) {
      issuesQuery.totalCount = count;
      return issuesQuery;
    })
  }

  function fetchIssues(issuesQuery) {
    var skipValue = (issuesQuery.page - 1) * ITEMS_PER_PAGE;
    if (skipValue < 0) {
      skipValue = 0;
    }
    return github.query({
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
    }).then(function(issues) {
      issuesQuery.issues = issues;
      return issuesQuery;
    });
  }

  function showError() {
    $scope.error = 'Could not update issues from server';
  }

  function renderData(issuesQuery) {
    console.log('renderData', issuesQuery);
    $scope.$apply(function() {
      $scope.issues = issuesQuery.issues;
    });
    return issuesQuery;
  }

  function renderPageCount(issuesQuery) {
    var pages;
    if (Array.isArray(issuesQuery.totalCount)) {
      pages = Math.ceil(issuesQuery.totalCount[0][COUNT_PROPERTY_NAME] / ITEMS_PER_PAGE);
    } else {
      pages = Math.ceil(issuesQuery.totalCount / ITEMS_PER_PAGE);
    }
    $scope.$apply(function(){
      $scope.pages=new Array(pages);
    });

    return issuesQuery;
  }
}

angular.module('ghIssuesApp').
  controller(
      'IssuesListController',
      ['$filter', '$location', '$scope', 'github', 'issueDefaults', 'lovefieldQueryBuilder',
          'firebaseAuth', 'organizationDefaults', 'repositoryDefaults', IssuesListController]).
  filter('filterByOrg', [filterByOrg]);

}());
