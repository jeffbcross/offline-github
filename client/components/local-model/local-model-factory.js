(function(){

function LocalModelFactory(USE_MEMORY_DB, checkSourceInterface,
    LocalModelCollection) {
  function LocalModel(name, db, sourceOfTruth) {
    if (sourceOfTruth && !checkSourceInterface(sourceOfTruth)) {
      throw new Error('Source of truth must provide methods: '+
          'read, subscribe, insert, update, delete');
    }
    this._db = db;
    this._sourceOfTruth = sourceOfTruth;
  }

  LocalModel.prototype.getCollection = function(name) {
    return LocalModelCollection(name, this._db);
  };

  return function(name, db, sourceOfTruth) {
    return new LocalModel(name, db, sourceOfTruth);
  }
}

function CheckSourceInterfaceFactory() {
  return function(source) {
    return ['subscribe','read','insert','update','delete'].
      filter(function(method) {
        return typeof source[method] === 'function';
      }).
      length === 5;
  }
}

angular.module('ghoLocalModelFactory',
    ['ghoDBService', 'ghoLocalModelCollectionFactory',
        'ghoLovefieldQueryFactory']).
  factory('checkSourceInterface', [CheckSourceInterfaceFactory]).
  factory('LocalModel', ['USE_MEMORY_DB', 'checkSourceInterface',
    'LocalModelCollection', LocalModelFactory]).
  constant('USE_MEMORY_DB', false);

}());
