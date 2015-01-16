(function(){

function LocalModelCollectionFactory(lovefieldQueryBuilder, getTable) {
  function Collection(name, db) {
    this._name = name;
    this._db = db;
  }

  Collection.prototype.subscribe = function(query) {
    var schema = getTable(this._db.getSchema(), this._name);
    var predicate = lovefieldQueryBuilder(query || {});

    var observeQuery = this._db.
      select().
      from(schema).
      where(predicate);

    var observer =  Rx.Observable.fromCallback(this._db.observe.bind(this._db));
    return observer(observeQuery);
  };

  return function(name, db) {
    return new Collection(name, db);
  };
}


angular.module('ghoLocalModelCollectionFactory', ['ghoDBService']).
  factory('LocalModelCollection', ['lovefieldQueryBuilder', 'getTable',
      LocalModelCollectionFactory]);

}());
