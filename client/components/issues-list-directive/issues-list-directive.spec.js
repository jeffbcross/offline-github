describe('IssuesListDirective', function() {
  var $compile, $rootScope;

  beforeEach(module('ghoIssuesListDirective', 'components/issues-list-directive/issues-list.html'));
  beforeEach(inject(function(_$compile_,_$rootScope_){
    $compile = _$compile_
    $rootScope = _$rootScope_
  }))

  it('should have a template', function() {
    var element = $compile('<gho-issues-list></gho-issues-list>')($rootScope);
    $rootScope.$digest();
    expect(element.html()).toContain('Issues List');
  });


  it('should create a repeater of issues provided in issues attribute', function() {
    var scope = $rootScope.$new()
    scope.issues = [{title: 'issue 1'},{title: 'issue 2'}];
    var element = $compile('<gho-issues-list issues="issues"></gho-issues-list>')(scope);
    scope.$digest();
    expect(element.find('li').length).toBe(2);
    expect(element.find('li')[0].innerHTML).toContain('issue 1');
  });


  it('should filter by filter input', function() {
    var scope = $rootScope.$new()
    scope.issues = [{title: 'should go away'},{title: 'should match'}];
    var element = $compile('<gho-issues-list issues="issues"></gho-issues-list>')(scope);
    scope.$digest();
    element.isolateScope().filterText = 'match';
    scope.$digest();

    expect(element.find('li').length).toBe(1);
    expect(element.find('li')[0].innerHTML).toContain('match');
  });
});
