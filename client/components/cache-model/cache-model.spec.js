describe('CacheModel', function() {
  var $httpBackend, $rootScope, $q, dbService, CacheModel, mockDB, mockIssues, qAny, queryObj, urlExp;
  angular.module('fakeDBService', []).service('dbServiceNot', function($q, $timeout) {
    var deferred = $q.defer();
    function MockDB () {
      this.eq = function(input) {
        return input;
      };
      this.getIssues = jasmine.createSpy('getIssues').and.returnValue(this);
      this.organization = this;
      this.repository = this;
      this.getSchema = jasmine.createSpy('getSchema').and.returnValue(this);
      this.select = jasmine.createSpy('select').and.returnValue(this);
      this.from = jasmine.createSpy('from').and.returnValue(this);
      this.where = jasmine.createSpy('where').and.returnValue(this);
      this.deferred = deferred;
      this.exec = jasmine.createSpy('exec').and.returnValue(deferred.promise);
    }
    mockDB = new MockDB();

    this.get = function() {
      var deferred = $q.defer();
      $timeout(function() {
        deferred.resolve(mockDB);
      })
      return deferred.promise;
    }
  });
  beforeEach(module('ghoCacheModel','mockIssues', 'fakeDBService'));
  beforeEach(inject(function(_$httpBackend_, _$rootScope_, _$q_, _$timeout_, _dbService_, _CacheModel_, _mockIssues_, _qAny_) {
    $httpBackend = _$httpBackend_;
    $rootScope = _$rootScope_;
    $q = _$q_;
    $timeout = _$timeout_;
    urlExp = 'https://github.com/repo/:organization/:repository/issues';
    CacheModel = _CacheModel_;
    qAny = _qAny_;
    mockIssues = _mockIssues_;
    queryObj = {repository: 'angular.js', organization: 'angular'};
    dbService = _dbService_;
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
  });


  it('should instantiate an object with a query method', function() {
    expect(typeof new CacheModel('Issues', urlExp).query).toBe('function');
  });


  describe('.query()', function() {
    it('should call httpQuery and dbQuery', function() {
      var cacheModel = new CacheModel('Issues', urlExp);
      var httpQuery = spyOn(cacheModel, 'httpQuery').and.returnValue({then: angular.noop});
      var dbQuery = spyOn(cacheModel, 'dbQuery').and.returnValue({then: angular.noop});
      var promise = cacheModel.query(queryObj);

      expect(httpQuery).toHaveBeenCalledWith(queryObj);
      expect(dbQuery).toHaveBeenCalledWith(queryObj);
    });
  });


  describe('.httpQuery()', function() {
    it('should request data from the server', function() {
      $httpBackend.whenGET('https://github.com/repo/angular/angular.js/issues').respond(200, mockIssues);
      var cacheModel = new CacheModel('Issues', urlExp);
      var responseSpy = jasmine.createSpy('responseSpy');
      cacheModel.httpQuery(queryObj).then(responseSpy);
      $httpBackend.flush();
      $rootScope.$digest();
      expect(responseSpy).toHaveBeenCalled();
      expect(responseSpy.calls.argsFor(0)[0].data().length).toBe(30);
    });
  });


  describe('.dbQuery()', function() {
    it('should load data from the database', function() {
      var cacheModel = new CacheModel('Issues', urlExp);
      var doneSpy = jasmine.createSpy('done');
      var issues = mockIssues();

      cacheModel.dbQuery(queryObj).then(doneSpy);
      $rootScope.$digest();
      // expect(doneSpy).toHaveBeenCalled();
    });


    it('should serialize the query', function(done) {
      jasmine.DEFAULT_TIMEOUT_INTERVAL=100;
      var cacheModel = new CacheModel('Issues', urlExp);
      var doneSpy = jasmine.createSpy('done');
      var issues = mockIssues();
      cacheModel.dbQuery(queryObj).then(doneSpy);
      $rootScope.$digest();
      var detachedExpect = expect;
      var interval = setInterval(function() {
        if (doneSpy.calls.count()) {
          detachedExpect(doneSpy).toHaveBeenCalled();
          clearInterval(interval);
          done();
        }
      }, 5);
    });
  });


  describe('qAny', function() {
    it('should resolve with the first promise that resolves', function() {
      var deferred1 = $q.defer();
      var deferred2 = $q.defer();
      var spy = jasmine.createSpy('resolved');
      qAny([deferred1.promise, deferred2.promise]).then(spy);
      deferred1.resolve('first');
      deferred2.resolve('second');
      $rootScope.$digest();
      expect(spy).toHaveBeenCalledWith('first');
      expect(spy.calls.count()).toBe(1);
    });
  });


  describe('urlExpMerger', function() {
    it('should merge the provided values into the url', inject(function(urlExpMerger) {
      expect(urlExpMerger(urlExp, {organization: 'angular', repository: 'angular.js'})).
          toBe('https://github.com/repo/angular/angular.js/issues');
    }));
  });
});
