var COUNT_PROPERTY_NAME = 'COUNT(id)';
//Have to do this so lovefield doesn't throw
window = self
importScripts('lovefield.js');
importScripts('db/github_db_gen.js');
importScripts('bower_components/lodash/lodash.js');
var db;
var table;
var promise = github.db.getInstance().then(function(_db_) {
  db = _db_;
  table = db.getSchema().getIssues();
});

var getItemQueue = {};
var firebaseAuthQueue;
var cachedAuth;
var predicate;
var totalAdded = 0;

onmessage = function(e) {
  var subscription;
  switch(e.data.operation) {
    case 'sync.read':
      Promise.resolve(promise).then(function() {
        subscription = {
          query: e.data.query,
          res: null,
          predicate: null
        }
        return subscription;
      }).
        then(setPredicate).
        then(buildUpdateUrl).
        then(fetchAllData);
      break;
    case 'localStorage.getItem':
      getItemQueue[e.data.key](e.data.result);
      break;
    case 'firebaseAuth.getAuth':
      cachedAuth = e.data.auth;
      firebaseAuthCallback(e.data.auth);
      break;
  }
}

function setPredicate(subscription) {
  subscription.predicate = lovefieldQueryBuilder(table, {
    owner: subscription.query.owner,
    repository: subscription.query.repository
  });
  return subscription;
}

function lovefieldQueryBuilder(schema, query){
  var normalizedQuery = [];
  var count = 0;
  for (var key in query) {
    if (query.hasOwnProperty(key) && schema[key]) {
      count++
      normalizedQuery.push(schema[key].eq(query[key]));
    }
  }

  if (!count) {
    return;
  }
  else if (count === 1) {
    return normalizedQuery[0];
  }
  else {
    return lf.op.and.apply(null, normalizedQuery);
  }
};


function fetchAllData(subscription) {

  return fetchItems(subscription).
    then(insertData).
    then(getNextPageUrl).
    then(countItems).
    then(function(subscription) {
      if (subscription.res && subscription.res.data && subscription.res.data.length) {
        var updatedAt = subscription.res.data[0].updated_at;
        localStorage.setItem(
            localKeyBuilder(subscription.query.owner,
              subscription.query.repository),
            updatedAt)
      }

      if (subscription.nextUrl) {
        return fetchAllData(subscription);
      } else {
      }
    });
}

function countItems(subscription) {
  return db.
    select(lf.fn.count(table.id)).
    from(table).
    where(subscription.predicate).
    exec().then(function(count){
      postMessage({
        operation: 'count.update',
        query: subscription.query,
        count: count[0][COUNT_PROPERTY_NAME]
      });
      return subscription;
    })
}

var localStorage = {
  getItem: function(key, query) {
    return new Promise(function(resolve, reject) {
      getItemQueue[key] = resolve;
      postMessage({
        operation: 'localStorage.getItem',
        key: key
      });
    });
  },
  setItem: function(key, val) {
    postMessage({
      operation: 'localStorage.setItem',
      key: key,
      payload: val
    });
  }
};

var firebaseAuth = {
  getAuth: function () {
    if (cachedAuth) return Promise.resolve(cachedAuth);
    return new Promise(function(resolve, reject) {
      firebaseAuthCallback = resolve;
      postMessage({
        operation: 'firebaseAuth.getAuth'
      });
    });
  }
};

function fetchItems(subscription) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', subscription.nextUrl);
    xhr.responseType = 'json';
    xhr.addEventListener('load', function(e) {
      subscription.res = {
        headers: xhr.getAllResponseHeaders(),
        data: xhr.response
      };
      resolve(subscription);
    })

    xhr.addEventListener('error', function(e) {
      reject(xhr.error);
    });
    xhr.send();
  });
}

function localKeyBuilder(owner, repo) {
  return owner + ':' + repo + ':last_update';
}

function insertData(subscription) {
  if (!subscription.res || !subscription.res.data) return subscription;
  var usersTable = db.getSchema().getUsers();
  var milestonesTable = db.getSchema().getMilestones();
  totalAdded += (subscription.res && subscription.res.data && subscription.res.data.length) || 0;
  var group = subscription.res.data.reduce(function(prev, issue) {
    var transformedIssue = issueStorageTranslator(issue, subscription.query);
    var transformedUser = userStorageTranslator(issue.user);
    var transformedMilestone = milestoneStorageTranslator(issue.milestone);

    if (transformedMilestone) {
      prev.milestones.push(milestonesTable.createRow(transformedMilestone));
    }
    if (transformedUser) {
      prev.users.push(usersTable.createRow(transformedUser));
    }
    if (transformedIssue) {
      prev.issues.push(table.createRow(transformedIssue));
    }

    return prev;
  }, {issues: [], users: [], milestones: []});

  return Promise.all([
    db.insertOrReplace().into(table).values(group.issues).exec().then(logAndReturn('issues')),
    db.insertOrReplace().into(usersTable).values(group.users).exec().then(logAndReturn('users')),
    db.insertOrReplace().into(milestonesTable).values(group.milestones).exec().then(logAndReturn('milestones'))
  ]).
  then(function() {
    return subscription;
  });
}

function buildUpdateUrl(subscription) {
  //TODO: order by and updated since
  //TODO: store timestamp in localstorage
  return Promise.all([
    localStorage.getItem(localKeyBuilder(subscription.query.owner, subscription.query.repository)),
    firebaseAuth.getAuth()
  ]).
  then(function(results) {
    var lastUpdated = results[0];
    var auth = results[1];
    subscription.nextUrl = 'https://api.github.com/repos/'+
      subscription.query.owner+
      '/'+
      subscription.query.repository+
      '/issues?'+
      'per_page=100&'+
      'state=all&'+
      'sort=updated&'+
      'direction=asc&'+
      (lastUpdated?'since='+lastUpdated+'&':'')+
      'access_token='+
      auth.github.accessToken;
    return subscription;
  });

}

function issueStorageTranslator(issue, query){
  /*jshint camelcase: false */

  var newIssue = _.clone(issue);
  newIssue.assignee = issue.assignee || -1;
  newIssue.body = issue.body || '';
  newIssue.user = issue.user.id;
  newIssue.owner = query.owner;
  newIssue.repository = query.repository;

  newIssue.milestone = issue.milestone || -1;
  newIssue.created_at = new Date(issue.created_at);
  newIssue.updated_at = new Date(issue.updated_at);
  newIssue.closed_at = new Date(issue.closed_at);
  return newIssue;
}

function userStorageTranslator(user) {
  var newUser = _.clone(user);
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
  return newUser;
}

function milestoneStorageTranslator (milestone) {
  if (!milestone) return milestone;
  var newMilestone = _.clone(milestone);
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
  return newMilestone;
}

function getNextPageUrl (subscription) {
  var linkHeader = subscription.res && subscription.res.headers;
  linkHeader = linkHeader.split('\n');
  linkHeader = linkHeader.filter(function(header) {
    var index = header.indexOf('Link');
    return index === 0;
  })[0];
  if (!linkHeader) subscription.nextUrl = null;
  var matched = /^Link: <(https:\/\/[a-z0-9\.\/\?_=&]*)>; rel="next"/gi.exec(linkHeader);
  subscription.nextUrl = matched? matched[1] : null;

  return subscription;
}

function logAndReturn (type) {
  return function (input) {
    return input;
  }
}
