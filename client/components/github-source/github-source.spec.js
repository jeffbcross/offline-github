/* global it:true, describe:true, beforeEach:true, module:true, expect:true,
inject:true, jasmine:true */

describe('githubSource', function() {
  var $httpBackend,
      $rootScope,
      $q,
      cacheModel,
      fakeSource,
      findSpy,
      githubSource,
      lovefieldSource,
      mockDB,
      mockIssues,
      mockOrganizations,
      queryObj,
      pathExp;

  beforeEach(module(
      'ghoCacheModel',
      'mockConstant',
      'mockIssues',
      'mockOrganizations',
      'ghoGithubSource'));
  beforeEach(function () {
    inject(function(
        _$httpBackend_,
        _$rootScope_,
        _githubSource_,
        _mockIssues_,
        _mockOrganizations_) {
      $httpBackend = _$httpBackend_;
      $rootScope = _$rootScope_;
      pathExp = 'repo/:owner/:repository/issues';
      mockIssues = _mockIssues_;
      mockOrganizations = _mockOrganizations_;
      queryObj = {repository: 'angular.js', owner: 'angular'};
      githubSource = _githubSource_;
    });
  });

  it('should request data from the server', function(done) {
    $httpBackend.
      whenGET('https://api.github.com/repo/angular/angular.js/issues').
      respond(200, mockIssues);
    var model = githubSource({type: 'Issues'});
    var responseSpy = jasmine.createSpy('responseSpy');
    model.find(queryObj).then(responseSpy).then(function() {
      expect(responseSpy).toHaveBeenCalled();
      expect(responseSpy.calls.argsFor(0)[0].data().length).toBe(30);
      done();
    });
    $httpBackend.flush();
    $rootScope.$digest();
  });


  describe('pathExpMerger', function() {
    it('should merge the provided values into the url',
        inject(function(pathExpMerger) {
      expect(pathExpMerger(
          pathExp,
          {owner: 'angular', repository: 'angular.js'})).
        toBe('repo/angular/angular.js/issues');
    }));
  });
});