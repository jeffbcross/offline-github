describe('CacheModel', function() {
  var $httpBackend, $rootScope, $q, dbService, CacheModel, mockDB, mockIssues, mockOrganizations, qAny, queryObj, urlExp;

  beforeEach(module('ghoCacheModel','mockConstant','mockIssues','mockOrganizations'));
  beforeEach(function (done) {
    inject(function(_$httpBackend_, _$rootScope_, _$q_, _$timeout_, _dbService_, _CacheModel_, _mockIssues_, _mockOrganizations_, _qAny_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      $timeout = _$timeout_;
      urlExp = 'https://github.com/repo/:owner/:repository/issues';
      CacheModel = _CacheModel_;
      qAny = _qAny_;
      mockIssues = _mockIssues_;
      mockOrganizations = _mockOrganizations_;
      queryObj = {repository: 'angular.js', owner: 'angular'};
      dbService = _dbService_;
    });

    populateDatabase().then(done);

    function issueStorageTranslator(issue){
      var newIssue = angular.copy(issue);
      newIssue.assignee = issue.assignee || -1;
      newIssue.milestone = issue.milestone || -1;
      newIssue.created_at = new Date(issue.created_at);
      newIssue.updated_at = new Date(issue.updated_at);
      return newIssue;
    }

    function populateDatabase () {
      return Promise.all(
        dbService.get().then(function(db) {
          var schema = db.getSchema().getIssues();
          var issuesInsert = mockIssues().map(function(issue) {
            return schema.createRow(issueStorageTranslator(issue));
          });
          return db.insertOrReplace().into(schema).values(issuesInsert).exec().then(done);
        }),
        dbService.get().then(function(db) {
          var orgsSchema = db.getSchema().getOrganizations();
          var orgsInsert = mockOrganizations().map(function(org) {
            return orgsSchema.createRow(org);
          });
          return db.insertOrReplace().into(orgsSchema).values(orgsInsert).exec();
        })
      );
    }
  });

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
    it('should load data from the database', function(done) {
      var cacheModel = new CacheModel('Issues', urlExp);

      cacheModel.dbQuery(queryObj).then(function(results) {
        expect(results.length).toBe(30);
        done();
      });
    });


    describe('join', function() {
      it('should attach foreign objects', function(done) {
        var cacheModel = new CacheModel('Issues', urlExp);
        queryObj.innerJoin = {
          localColumn: 'owner',
          remoteSchema: 'Organizations',
          remoteColumn: 'login'
        }

        cacheModel.dbQuery(queryObj).then(function(results) {
          expect(results[0].owner.login).toBe('angular');
          done();
        })
      });
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
      expect(urlExpMerger(urlExp, {owner: 'angular', repository: 'angular.js'})).
          toBe('https://github.com/repo/angular/angular.js/issues');
    }));
  });
});
