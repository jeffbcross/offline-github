if (typeof window === 'undefined') {
  window = self;
}

importScripts('../../lovefield.js');
importScripts('../../db/github_db_gen.js');

var db;

var dbPromise = github.db.getInstance().then(function(_db_) {
  db = _db_;
  postMessage('dbInstance.success');
  return _db_;
}, function(e) {
  postMessage('dbInstance.error');
});

var operationHandlers = {
  'query.exec': buildAndExecQuery,
  'count.exec': execCountQuery,
  'synchronize.fetch': fetchAndInsertData
};

onmessage = function(msg) {
  Promise.resolve(dbPromise).
    then(function() {
      return msg.data;
    }).
    then(getTable).
    then(operationHandlers[msg.data.operation]).
    then(notifyMainThread, notifyMainThread);
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
    then(setLastUpdated).
    then(notifyMainThreadProgress).
    then(loadMore);
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
  var items = queryContext.res.data;
  if (queryContext.totalAdded === undefined) {
    queryContext.totalAdded = 0;
  }
  queryContext.totalAdded += (queryContext.res.data.length) || 0;
  var rows = items.map(function(object){
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
          object[k] = new Date(object[k] || undefined);

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
  if (!linkHeader) {
    queryContext.nextUrl = null;
  }
  var matched = /^Link: <(https:\/\/[a-z0-9\.\/\?\%\-_=&]*)>; rel="next"/gi.exec(linkHeader);
  queryContext.nextUrl = matched? matched[1] : null;
  return queryContext;
}

function setLastUpdated(queryContext) {
  if (queryContext.res && queryContext.res.data && queryContext.res.data.length) {
    queryContext.lastUpdated = queryContext.res.data[0].updated_at;
    if (queryContext.lastUpdated instanceof Date) {
      queryContext.lastUpdated = queryContext.lastUpdated.toISOString();
    }
    postMessage({
      operation: 'lastUpdated.set',
      queryId: queryContext.queryId,
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

function getTable(queryContext) {
  queryContext.table = db.getSchema()['get'+queryContext.tableName]();
  return queryContext;
}

function setBaseQuery (queryContext) {
  var mapped = queryContext.select.map(function(select) {
    var select = queryContext.table[select];
    return select;
  });

  queryContext.query = db.select.apply(db, mapped).
    from(queryContext.table);

  return queryContext;
}

function setCountQuery (queryContext) {
  queryContext.query = db.
    select(lf.fn.count(queryContext.table[queryContext.column])).
    from(queryContext.table).
    where(predicateBuilder(
        queryContext.table,
        queryContext.rawQueryPredicate));
  return queryContext;
}

function setPredicate(queryContext) {
  queryContext.predicate = predicateBuilder(queryContext.table, queryContext.rawQueryPredicate);
  if(queryContext.query) {
    queryContext.query = queryContext.query.where(queryContext.predicate);
  }

  return queryContext;
}

function paginate (queryContext) {
  if (queryContext.limit) {
    queryContext.query = queryContext.query.limit(queryContext.limit);
  }
  if (queryContext.skip) {
    queryContext.query = queryContext.query.skip(queryContext.skip);
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
  var startTime = performance.now();
  return queryContext.query.exec().then(function(results) {
    queryContext.results = results;
    return queryContext;
  }, function(e) {
    queryContext.error = e;
    return Promise.reject(queryContext);
  });
}

function notifyMainThread (queryContext) {
  postMessage({
    queryId: queryContext.queryId,
    operation: queryContext.operation+'.'+(queryContext.error?'error':'success'),
    results: queryContext.results || queryContext.error
  });
}

function notifyMainThreadProgress (queryContext) {
  postMessage({
    queryId: queryContext.queryId,
    operation: queryContext.operation+'.progress'
  });
  return queryContext;
}

/**
 * Factory functions
 **/

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