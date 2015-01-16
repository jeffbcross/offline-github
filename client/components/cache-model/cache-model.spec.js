/* global it:true, describe:true, beforeEach:true, module:true, expect:true,
inject:true, spyOn:true, jasmine:true, afterEach:true, */

xdescribe('cacheModel', function() {
  var $httpBackend,
      $rootScope,
      $q,
      db,
      cacheModel,
      fakeSource,
      findSpy,
      httpSource,
      lovefieldSource,
      mockDB,
      mockIssues,
      mockOrganizations,
      queryObj,
      urlExp;

  beforeEach(module(
      'ghoCacheModel',
      'ghoDBService',
      'mockConstant',
      'mockIssues',
      'mockOrganizations'));
  beforeEach(function (done) {
    inject(function(
        _$httpBackend_,
        _$rootScope_,
        _$q_,
        _db_,
        _cacheModel_,
        _httpSource_,
        _lovefieldSource_,
        _mockIssues_,
        _mockOrganizations_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      $q = _$q_;
      urlExp = 'https://github.com/repo/:owner/:repository/issues';
      cacheModel = _cacheModel_;
      mockIssues = _mockIssues_;
      mockOrganizations = _mockOrganizations_;
      queryObj = {repository: 'angular.js', owner: 'angular'};
      db = _db_;
      httpSource = _httpSource_;
      lovefieldSource = _lovefieldSource_;
      findSpy = jasmine.createSpy('find').and.returnValue($q.defer().promise);
      fakeSource = function() { return {find: findSpy};};
    });

    populateDatabase().then(done);

    function issueStorageTranslator(issue){
      /*jshint camelcase: false */
      var newIssue = angular.copy(issue);
      newIssue.assignee = issue.assignee || -1;
      newIssue.milestone = issue.milestone || -1;
      newIssue.created_at = new Date(issue.created_at);
      newIssue.updated_at = new Date(issue.updated_at);
      return newIssue;
    }

    function safeApplyAndReturn (val) {
      if (!$rootScope.$$phase) {
        $rootScope.$digest();
      }
      return val;
    }

    function populateDatabase () {
      return Promise.all(
        [db.get().then(function(db) {
          var schema = db.getSchema().getIssues();
          var issuesInsert = mockIssues().map(function(issue) {
            return schema.createRow(issueStorageTranslator(issue));
          });
          return db.insertOrReplace().into(schema).values(issuesInsert).exec();
        }),
        db.get().then(function(db) {
          var orgsSchema = db.getSchema().getOrganizations();
          var orgsInsert = mockOrganizations().map(function(org) {
            return orgsSchema.createRow(org);
          });
          return db.
            insertOrReplace().
            into(orgsSchema).
            values(orgsInsert).
            exec();
        })]);
    }
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingRequest();
  });


  it('should instantiate an object with a query method', function() {
    expect(typeof new cacheModel([fakeSource]).find).toBe('function');
  });


  describe('.find()', function() {
    it('should query all sources when calling find', function() {
      var model = new cacheModel([fakeSource()]);

      model.find({id: 53140280});

      expect(findSpy).toHaveBeenCalled();
    });


    it('should load data from the database', function(done) {
      var model = cacheModel([lovefieldSource('Issues')]);

      model.find(queryObj).then(function(results) {
        expect(results.length).toBe(30);
        model.find({id: 53140280}).then(function(results) {
          expect(results.length).toBe(1);
          expect(results.shift().id).toBe(53140280);
          done();
        });
      });
    });
  });


  describe('.save()', function() {
    it('should insert records that do not yet exist', function(done) {
      var model = cacheModel([lovefieldSource('Organizations')]);
      model.save([{
        'login': 'FakeOrg',
        'id': 1,
        'url': 'https://api.github.com/orgs/FakeOrg',
        'repos_url': 'https://api.github.com/orgs/FakeOrg/repos',
        'events_url': 'https://api.github.com/orgs/FakeOrg/events',
        'members_url': 'https://api.github.com/orgs/FakeOrg/members{/member}',
        'public_members_url':
          'https://api.github.com/orgs/FakeOrg/public_members{/member}',
        'avatar_url': 'https://avatars.githubusercontent.com/u/884285?v=3',
        'description': null
      }]).then(done);
    });


    it('should update records that already exist', function(done) {
      var model = cacheModel([lovefieldSource('Organizations')]);
      model.save([{
          'login': 'Jasig!',
          'id': 884285,
          'url': 'https://api.github.com/orgs/Jasig',
          'repos_url': 'https://api.github.com/orgs/Jasig/repos',
          'events_url': 'https://api.github.com/orgs/Jasig/events',
          'members_url': 'https://api.github.com/orgs/Jasig/members{/member}',
          'public_members_url':
            'https://api.github.com/orgs/Jasig/public_members{/member}',
          'avatar_url': 'https://avatars.githubusercontent.com/u/884285?v=3',
          'description': null
        }]).then(function() {
          model.find({id: 884285}).then(function(results){
            expect(results[0].login).toBe('Jasig!');
            done();
          });
        });
    });


    it('should only save for specified source if singleSource provided',
        function(done) {
      var lfSource = lovefieldSource('Organizations');
      var http = httpSource('https://api.github.com/user/orgs');
      var model = cacheModel([lfSource, http]);
      var httpSpy = spyOn(http, 'save');
      var lfSpy = spyOn(lfSource, 'save');

      model.save([{
          'login': 'Jasig!',
          'id': 884285,
          'url': 'https://api.github.com/orgs/Jasig',
          'repos_url': 'https://api.github.com/orgs/Jasig/repos',
          'events_url': 'https://api.github.com/orgs/Jasig/events',
          'members_url': 'https://api.github.com/orgs/Jasig/members{/member}',
          'public_members_url':
            'https://api.github.com/orgs/Jasig/public_members{/member}',
          'avatar_url': 'https://avatars.githubusercontent.com/u/884285?v=3',
          'description': null
        }], {singleSource: lfSource}).then(function() {
          expect(lfSpy).toHaveBeenCalled();
          expect(httpSpy).not.toHaveBeenCalled();
          done();
        });
    });
  });


  describe('httpSource', function() {
    it('should request data from the server', function(done) {
      $httpBackend.
        whenGET('https://github.com/repo/angular/angular.js/issues').
        respond(200, mockIssues);
      var model = new cacheModel([httpSource(urlExp)]);
      var responseSpy = jasmine.createSpy('responseSpy');
      model.find(queryObj).then(responseSpy).then(function() {
        expect(responseSpy).toHaveBeenCalled();
        expect(responseSpy.calls.argsFor(0)[0].data().length).toBe(30);
        done();
      });
      $httpBackend.flush();
      $rootScope.$digest();
    });
  });


  describe('urlExpMerger', function() {
    it('should merge the provided values into the url',
        inject(function(urlExpMerger) {
      expect(urlExpMerger(
          urlExp,
          {owner: 'angular', repository: 'angular.js'})).
        toBe('https://github.com/repo/angular/angular.js/issues');
    }));
  });
});
