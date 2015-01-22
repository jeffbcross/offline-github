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

    return Promise.all(res.data.map(function(issue) {
      console.log('mapping', issue);
      var promise = issueStorageTranslator(issue);
      console.log('then', promise.then);
      return promise.then(createRow);
    })).
      then(function(issues) {
        console.log('issues');
        return db.insertOrReplace().into(table).values(issues).exec()
      }, function(e) {
        console.log('could not get issues', e.stack)
      }).
      then(function() {
        console.log('done inserting');
        return res;
      }, function(e) {
        console.log('problem inserting', e.message);
      });
  }

  function createRow(issue) {
    console.log('createRow', issue);
    return table.createRow(issue);
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
    var usersTable = db.getSchema().getUsers();
    var milestonesTable = db.getSchema().getMilestones();

    return userStorageTranslator(issue.user).
      then(function(user) {
        var row = usersTable.createRow(user);
        return db.
          insertOrReplace().
          into(usersTable).
          values([row]).
          exec().
          then(function() {
            console.log('then transform milestone');
            return milestoneStorageTranslator(issue.milestone);
          }).
          then(function(milestone) {
            console.log('then insert milestone');
            var row = milestonesTable.createRow(milestone);
            return db.
              insertOrReplace().
              into(milestonesTable).
              values([row]).
              exec()
          }).
          then(function() {
            console.log('then create issue');
            var newIssue = angular.copy(issue);
            newIssue.assignee = issue.assignee || -1;
            newIssue.body = issue.body || '';
            newIssue.user = issue.user.id;

            newIssue.milestone = issue.milestone || -1;
            newIssue.created_at = new Date(issue.created_at);
            newIssue.updated_at = new Date(issue.updated_at);
            newIssue.closed_at = new Date(issue.closed_at);
            return newIssue;
          });
      });
  }

  function userStorageTranslator(user) {
    var newUser = angular.copy(user);
    newUser.login =user.login || '';
    newUser.id =parseInt(user.id, 10);
    newUser.avatar_url =user.avatar_url || '';
    newUser.gravatar_id =user.gravatar_id || '';
    newUser.url =user.url || '';
    newUser.html_url =user.html_url || '';
    newUser.followers_url =user.followers_url || '';
    newUser.following_url =user.following_url || '';
    newUser.gists_url =user.gists_url || '';
    newUser.starred_url =user.starred_url || '';
    newUser.subscriptions_url =user.subscriptions_url || '';
    newUser.organizations_url =user.organizations_url || '';
    newUser.repos_url =user.repos_url || '';
    newUser.events_url =user.events_url || '';
    newUser.received_events_url =user.received_events_url || '';
    newUser.type =user.type || '';
    newUser.site_admin =user.site_admin || false;
    newUser.name =user.name || '';
    newUser.company =user.company || '';
    newUser.blog =user.blog || '';
    newUser.location =user.location || '';
    newUser.email =user.email || '';
    newUser.hireable =user.hireable || false;
    newUser.bio =user.bio || '';
    newUser.public_repos =parseInt(user.public_repos, 10) || -1;
    newUser.public_gists =parseInt(user.public_gists, 10) || -1;
    newUser.followers =parseInt(user.followers, 10) || -1;
    newUser.following =parseInt(user.following, 10) || -1;
    newUser.created_at =new Date(user.created_at);
    newUser.updated_at =new Date(user.updated_at);
    return Promise.resolve(newUser);
  }

  function milestoneStorageTranslator (milestone) {
    var newMilestone = angular.copy(milestone);
    newMilestone.url = milestone.url || '';
    newMilestone.number = parseInt(milestone.number, 10);
    newMilestone.state = milestone.state || '';
    newMilestone.title = milestone.title || '';
    newMilestone.description = milestone.description || '';
    newMilestone.creator = parseInt(milestone.creator, 10);
    newMilestone.open_issues = parseInt(milestone.open_issues, 10);
    newMilestone.closed_issues = parseInt(milestone.closed_issues, 10);
    newMilestone.created_at = new Date(milestone.created_at);
    newMilestone.updated_at = new Date(milestone.updated_at);
    newMilestone.closed_at = new Date(milestone.closed_at);
    newMilestone.due_on = new Date(milestone.due_on);
    return Promise.resolve(newMilestone);
  }

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
