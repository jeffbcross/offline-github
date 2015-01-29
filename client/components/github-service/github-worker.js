console.log('time at start of WebWorker', performance.now());
window = self;
importScripts('../../lovefield.js');
importScripts('../../db/github_db_gen.js');

var db;
var startGettingDb = performance.now();

var dbPromise = github.db.getInstance().then(function(_db_) {
  console.log('db instance loaded time', performance.now());
  console.log('db instance delta', performance.now() - startGettingDb);
  db = _db_;
  console.log('postMessage at ', performance.now());
  postMessage('dbInstance.success');
  return _db_;
}, function(e) {
  postMessage('dbInstance.error');
});


onmessage = function(msg) {
  console.log('message received timestamp: ', performance.now());
  Promise.resolve(dbPromise).then(function() {
    switch(msg.data.operation) {
      case 'query.exec':
        return Promise.resolve(msg.data).
          then(getTable).
          then(buildAndExecQuery).
          then(notifyMainThread, notifyMainThread);
        break;
      case 'count.exec':
        return Promise.resolve(msg.data).
          then(getTable).
          then(execCountQuery).
          then(notifyMainThread, notifyMainThread);
        break;
      case 'synchronize.fetch':
        return Promise.resolve(msg.data).
          then(getTable).
          then(fetchAndInsertData).
          then(notifyMainThread, notifyMainThread);
        break;
      default:
        console.log('could not match', msg);
    }
  });
}

/**
 * Meta functions
 **/

function execCountQuery(queryContext) {
  return Promise.resolve(setCountQuery(queryContext)).
        then(execQuery);
}

function buildAndExecQuery(queryContext) {
  return Promise.resolve(setBaseQuery(queryContext)).
    then(setPredicate).
    then(paginate).
    then(orderBy).
    then(execQuery);
}

function fetchAndInsertData(queryContext) {
  return fetchItems(queryContext).
    then(insertData).
    then(getNextPageUrl).
    then(countItems).
    then(setLastUpdated).
    then(loadMore);
}

function notifyMainThread (queryContext) {
  postMessage({
    queryId: queryContext.queryId,
    operation: queryContext.operation+'.'+(queryContext.error?'error':'success'),
    results: queryContext.results || queryContext.error
  });
}

/**
 * Pipeline functions
 **/

function fetchItems(queryContext) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', queryContext.nextUrl || queryContext.url);
    xhr.responseType = 'json';
    xhr.addEventListener('load', function(e) {
      queryContext.res = {
        headers: xhr.getAllResponseHeaders(),
        data: xhr.response
      };
      resolve(queryContext);
    })

    xhr.addEventListener('error', function(e) {
      reject(xhr.error);
    });
    xhr.send();
  });
}

function insertData(queryContext) {
  if (!queryContext.res || !queryContext.res.data) {
    return queryContext;
  }
  var issues = queryContext.res.data;
  if (queryContext.totalAdded === undefined) {
    queryContext.totalAdded = 0;
  }
  queryContext.totalAdded += (queryContext.res.data.length) || 0;
  var rows = issues.map(function(object){
    return queryContext.table.createRow(
        storageTranslator(object, queryContext.defaults));
  });


  return db.
    insertOrReplace().
    into(queryContext.table).
    values(rows).exec().then(function() {
      return queryContext;
    });
}

function storageTranslator (object, defaults) {
  for (var k in defaults) {
    if (defaults[k].transformer && object[k]) {
      var instructions = defaults[k].transformer.split(':');
      switch(instructions[0]) {
        case 'prop':
          object[k] = object[k][instructions[1]];
          break;
        case 'as_date':
          object[k] = new Date(object[k]);
          break;
      }
    } else {
      object[k] = object[k] || defaults[k].defaultValue;
    }
  }

  return object;
}

function getNextPageUrl (queryContext) {
  var linkHeader = queryContext.res && queryContext.res.headers;
  linkHeader = linkHeader.split('\n');
  linkHeader = linkHeader.filter(function(header) {
    var index = header.indexOf('Link');
    return index === 0;
  })[0];
  if (!linkHeader) queryContext.nextUrl = null;
  var matched = /^Link: <(https:\/\/[a-z0-9\.\/\?_=&]*)>; rel="next"/gi.exec(linkHeader);
  queryContext.nextUrl = matched? matched[1] : null;

  return queryContext;
}

function setLastUpdated(queryContext) {
  if (queryContext.res && queryContext.res.data && queryContext.res.data.length) {
    queryContext.lastUpdated = queryContext.res.data[0].updated_at;
    postMessage({
      operation: 'lastUpdated.set',
      processId: queryContext.processId,
      lastUpdated: queryContext.lastUpdated
    });
  }
  return queryContext;
}

function loadMore(queryContext) {
  if (queryContext.nextUrl) {
    return fetchAndInsertData(queryContext);
  }
  return queryContext;
}

function countItems(queryContext) {
  console.log('countItems', queryContext);
  return db.
    select(lf.fn.count(queryContext.table[queryContext.countColumn])).
    from(queryContext.table).
    where(queryContext.predicate).
    exec().then(function(count){
      postMessage({
        operation: 'count.update',
        processId: queryContext.processId,
        query: queryContext.query,
        count: count[0][queryContext.countPropertyName]
      });
      return queryContext;
    })
}

function getTable(queryContext) {
  console.log('getTable timestamp: ', performance.now());
  queryContext.table = db.getSchema()['get'+queryContext.tableName]();
  console.log('done in getTable')
  return queryContext;
}

function setBaseQuery (queryContext) {
  console.log('setBaseQuery timestamp: ', performance.now());
  var mapped = queryContext.select.map(function(select) {
    var select = queryContext.table[select];
    return select;
  });

  queryContext.query = db.select.apply(db, mapped).
    from(queryContext.table);

  return queryContext;
}

function setCountQuery (queryContext) {
  console.log('setCountQuery');
  queryContext.query = db.
    select(lf.fn.count(queryContext.table[queryContext.column])).
    from(queryContext.table).
    where(predicateBuilder(
        queryContext.table,
        queryContext.rawQueryPredicate));
  return queryContext;
}

function setPredicate(queryContext) {
  console.log('setPredicate timestamp: ', performance.now());
  console.log(queryContext)
  queryContext.predicate = predicateBuilder(queryContext.table, queryContext.rawQueryPredicate);
  if(queryContext.query) {
    queryContext.query = queryContext.query.where(queryContext.predicate);
  }

  return queryContext;
}

function paginate (queryContext) {
  console.log('paginate timestamp: ', performance.now());
  if (queryContext.skip && queryContext.limit) {
    queryContext.query = queryContext.query.limit(queryContext.limit).
    skip(queryContext.skip);
  } else {
  }

  return queryContext;
}

function orderBy (queryContext) {
  if (queryContext.orderByColumn && queryContext.orderByDirection) {
    queryContext.query = queryContext.query.orderBy(
        queryContext.table[queryContext.orderByColumn],
        queryContext.orderByDirection);
  } else if (queryContext.orderByColumn) {
    queryContext.query = queryContext.query.orderBy(
        queryContext.table[queryContext.orderByColumn]);
  }

  return queryContext;
}

function execQuery(queryContext) {
  console.log('execQuery timestamp: ', performance.now());
  var startTime = performance.now();
  return queryContext.query.exec().then(function(results) {
    console.log('query time inside worker', performance.now() - startTime)
    console.log('exec done timestamp', performance.now())
    queryContext.results = results;
    return queryContext;
  }, function(e) {
    queryContext.error = e;
    return Promise.reject(queryContext);
  });
}

function predicateBuilder(schema, query){
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