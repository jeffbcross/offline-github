/* global it:true, describe:true, beforeEach:true, module:true, expect:true,
inject:true */

describe('IssuesListDirective', function() {
  var $compile, $rootScope, mockIssues;

  beforeEach(module(
      'ghoIssuesListDirective',
      'mockIssues',
      'components/issues-list-directive/issues-list.html'));
  beforeEach(inject(function(_$compile_, _$rootScope_, _mockIssues_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    mockIssues = _mockIssues_();
  }));

  it('should have a template', function() {
    var element = $compile('<gho-issues-list></gho-issues-list>')($rootScope);
    $rootScope.$digest();
    expect(element.html()).toContain('Issues List');
  });


  it('should create a repeater of issues provided in issues attribute',
      function() {
    var scope = $rootScope.$new();
    scope.issues = mockIssues;
    var element = $compile(
        '<gho-issues-list issues="issues"></gho-issues-list>')(scope);
    scope.$digest();
    expect(element.find('li').length).toBe(25);
    expect(element.find('li')[0].innerHTML).toContain('chore(travis)');
  });


  it('should limit the repeater to 25 issues', function() {
    var scope = $rootScope.$new();
    scope.issues = mockIssues;
    var element = $compile(
        '<gho-issues-list issues="issues"></gho-issues-list>')(scope);
    scope.$digest();
    expect(element.find('li').length).toBe(25);
  });


  it('should filter by filter input', function() {
    var scope = $rootScope.$new();
    scope.issues = mockIssues;
    var element = $compile(
        '<gho-issues-list issues="issues"></gho-issues-list>')(scope);
    scope.$digest();
    element.isolateScope().filterText = 'browserDisconnectTolerance';
    scope.$digest();

    expect(element.find('li').length).toBe(1);
    expect(element.find('li')[0].innerHTML).
      toContain('browserDisconnectTolerance');
  });


  it('should show the specified zero-indexed page of results', function () {
    var scope = $rootScope.$new();
    scope.issues = mockIssues;
    var element = $compile(
        '<gho-issues-list issues="issues" page="1"></gho-issues-list>')(scope);
    scope.$digest();
    expect(element.find('li').length).toBe(5);
  });
});
