(function(){

function LocalModelCollectionFactory(lovefieldQueryBuilder, getTable) {
  function Collection(name, db) {
    this._name = name;
    this._db = db;
  }

  Collection.prototype.subscribe = function(query) {
    var self = this;
    var schema = getTable(this._db.getSchema(), this._name);
    var predicate = lovefieldQueryBuilder(query || {});

    var observeQuery = this._db.
      select().
      from(schema).
      where(predicate);

    return Rx.Observable.fromCallback(this._db.observe.bind(this._db))(observeQuery);
  };

  return function(name, db) {
    return new Collection(name, db);
  };


  function trimChanges(lastLength, list) {
    // dump('trimChanges', lastLength, list.length);
    return list.slice(lastLength);
  }
}


angular.module('ghoLocalModelCollectionFactory', ['ghoDBService']).
  factory('LocalModelCollection', ['lovefieldQueryBuilder', 'getTable',
      LocalModelCollectionFactory]);

}());
