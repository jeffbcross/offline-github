var COUNT_PROPERTY_NAME = 'COUNT(id)';
//Have to do this so lovefield doesn't throw
window = self
importScripts('../../lovefield.js');
importScripts('../../db/github_db_gen.js');
var db;
var table;
var promise = github.db.getInstance().then(function(_db_) {
  db = _db_;
  table = db.getSchema().getIssues();
});

var getItemQueue = {};
var cachedAuth;
var predicate;
var subscriptions = new Map();

onmessage = function(e) {
  var subscription;
  switch(e.data.operation) {
    case 'synchronize.fetch':
      Promise.resolve(promise).then(function() {
        var config = e.data;
        var subscription = new Subscription(config.query, config.tableName,
            config.processId, config.url, config.rowDefaults,
            config.storageKey);
        subscriptions.set(config.processId, subscription);
        return subscription;
      }).
        then(setPredicate).
        then(fetchAllData);
      break;
    case 'localStorage.getItem':
      getItemQueue[e.data.key](e.data.result);
      break;
  }
}

function Subscription (query, tableName, processId, url, rowDefaults,
    storageKey) {
  this.query = query;
  this.res = null;
  this.predicate = null;
  this.nextUrl = null;
  this.tableName = tableName;
  this.table = db.getSchema()['get'+tableName]();
  this.processId = processId;
  this.nextUrl = url;
  this.rowDefaults = rowDefaults;
  this.storageKey = storageKey;
  this.totalAdded = 0;
}

function setPredicate(subscription) {
  subscription.predicate = lovefieldQueryBuilder(subscription.table, {
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
    then(setLastUpdated).
    then(loadMore);
}

function setLastUpdated(subscription) {
  if (subscription.res && subscription.res.data && subscription.res.data.length) {
    subscription.lastUpdated = subscription.res.data[0].updated_at;
    postMessage({
      operation: 'lastUpdated.set',
      processId: subscription.processId,
      lastUpdated: subscription.lastUpdated
    });
  }
  return subscription;
}

function loadMore(subscription) {
  if (subscription.nextUrl) {
    return fetchAllData(subscription);
  }
}

function countItems(subscription) {
  return db.
    select(lf.fn.count(table.id)).
    from(table).
    where(subscription.predicate).
    exec().then(function(count){
      postMessage({
        operation: 'count.update',
        processId: subscription.processId,
        query: subscription.query,
        count: count[0][COUNT_PROPERTY_NAME]
      });
      return subscription;
    })
}

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
  subscription.totalAdded += (subscription.res && subscription.res.data && subscription.res.data.length) || 0;

  var rows = subscription.res.data.map(function(object){
    return subscription.table.createRow(
        storageTranslator(object, subscription.defaults));
  })

  return db.insertOrReplace().into(subscription.table).values(rows).exec().
    then(function() {
      return subscription;
    });
}

function storageTranslator (object, defaults) {
  for (var k in defaults) {
    object[k] = object[k] || defaults[k];
  }
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
