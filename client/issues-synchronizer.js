var COUNT_PROPERTY_NAME = 'COUNT(id)';
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
  var pipeline;
  console.log('message!', e);
  switch(e.data.operation) {
    case 'sync.read':

      Promise.resolve(promise).then(function() {
        pipeline = {
          query: e.data.query,
          res: null,
          predicate: null
        }
        return pipeline;
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

function setPredicate(pipeline) {
  pipeline.predicate = lovefieldQueryBuilder(table, {
    owner: pipeline.query.owner,
    repository: pipeline.query.repository
  });
  return pipeline;
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


function fetchAllData(pipeline) {
  console.log('fetchAllData', pipeline.startingUrl);

  return fetchIssues(pipeline).
    then(insertData).
    then(getNextPageUrl).
    then(countIssues).
    then(function(pipeline) {
      if (pipeline.startingUrl) {
        return fetchAllData(pipeline);
      } else {
        console.log('no nextPageUrl', pipeline.startingUrl);
      }
    });
}

function countIssues(pipeline) {
  return db.
    select(lf.fn.count(table.id)).
    from(table).
    where(pipeline.predicate).
    exec().then(function(count){
      postMessage({
        operation: 'count.update',
        count: count[0][COUNT_PROPERTY_NAME]
      });
      return pipeline;
    })
}

var localStorage = {
  getItem: function(key) {
    return new Promise(function(resolve, reject) {
      getItemQueue[key] = resolve;
      postMessage({
        operation: 'localStorage.getItem',
        key: key
      });
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

function fetchIssues(pipeline) {
  return new Promise(function(resolve, reject) {
    console.log('fetching ', pipeline.startingUrl);
    var xhr = new XMLHttpRequest();
    xhr.open('get', pipeline.startingUrl);
    xhr.responseType = 'json';
    xhr.addEventListener('load', function(e) {
      console.log('xhr load', xhr)
      pipeline.res = {
        headers: xhr.getAllResponseHeaders(),
        data: xhr.response
      };
      resolve(pipeline);
    })

    xhr.addEventListener('error', function(e) {
      console.log('error', e);
      reject(xhr.error);
    });
    xhr.send();
  });
}

function localKeyBuilder(owner, repo) {
  return owner + ':' + repo + ':last_update';
}

function insertData(pipeline) {
  if (!pipeline.res || !pipeline.res.data) return pipeline;
  var usersTable = db.getSchema().getUsers();
  var milestonesTable = db.getSchema().getMilestones();
  totalAdded += (pipeline.res && pipeline.res.data && pipeline.res.data.length) || 0;
  var group = pipeline.res.data.reduce(function(prev, issue) {
    var transformedIssue = issueStorageTranslator(issue, pipeline.query);
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
    return pipeline;
  });
}

function buildUpdateUrl(pipeline) {
  //TODO: order by and updated since
  //TODO: store timestamp in localstorage
  return Promise.all([
    localStorage.getItem(localKeyBuilder(pipeline.query.owner, pipeline.query.repository)),
    firebaseAuth.getAuth()
  ]).
  then(function(results) {
    console.log('results in buildUpdateUrl', results);
    var lastUpdated = results[0];
    var auth = results[1];
    pipeline.startingUrl = 'https://api.github.com/repos/'+
      pipeline.query.owner+
      '/'+
      pipeline.query.repository+
      '/issues?'+
      'per_page=100&'+
      'state=all&'+
      'sort=updated&'+
      'direction=asc&'+
      (lastUpdated?'since='+lastUpdated+'&':'')+
      'access_token='+
      auth.github.accessToken;
    return pipeline;
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

function getNextPageUrl (pipeline) {
  var linkHeader = pipeline.res && pipeline.res.headers;
  linkHeader = linkHeader.split('\n');
  linkHeader = linkHeader.filter(function(header) {
    var index = header.indexOf('Link');
    return index === 0;
  })[0];
  if (!linkHeader) pipeline.startingUrl = null;
  var matched = /^Link: <(https:\/\/[a-z0-9\.\/\?_=&]*)>; rel="next"/gi.exec(linkHeader);
  pipeline.startingUrl = matched? matched[1] : null;

  return pipeline;
}

function logAndReturn (type) {
  return function (input) {
    console.log('done inserting', type, ':', input);
    return input;
  }
}
