/* global it:true, describe:true, beforeEach:true, module:true, expect:true,
inject:true */

describe('LocalModel', function() {
  var LocalModel, db;
  beforeEach(function(done) {
    module('ghoLocalModelFactory','ghoMockConstant', 'ghoMockSource');
    inject(function(_LocalModel_, _MockSource_) {
      LocalModel = _LocalModel_;
      MockSource = _MockSource_;

      github.db.getInstance(undefined, false).then(function(_db_) {
        db = _db_;
      }).then(done);
    });
  });


  describe('constructor', function() {
    it('should return an object with a collection accessor method', function() {
      var Github = LocalModel('Github', db);
      expect(typeof Github.getCollection).toBe('function');
    });


    it('should hold a reference to an instance of the provided database',
        function() {
      var Github = LocalModel('Github', db);
      expect(typeof Github._db.select).toBe('function');
    });


    it('should require that provided source of truth matches source interface',
        function() {
      expect(function() {
        LocalModel('Github', db, {});
      }).toThrow(new Error('Source of truth must provide methods: '+
          'read, subscribe, insert, update, delete'));
    });
  });


  describe('.synchronize()', function() {
    it('should push pending writes to the source of truth', function() {

    });


    it('should update local collections with changes from the server',
        function() {

    });


    it('should return an observable', function() {

    });
  });



  describe('.getCollection()', function() {
    it('should return an object with subscribe, insert, update, and delete '+
        'methods', function() {
      //foo
    });
  });
});
