describe('LocalModelCollection', function() {
  var db, Issues, LocalModelCollection, mockIssues;

  beforeEach(function(done) {
    module('ghoLocalModelFactory','ghoMockConstant', 'ghoMockSource', 'mockIssues');
    inject(function(_LocalModelCollection_, _mockIssues_) {
      LocalModelCollection = _LocalModelCollection_;
      mockIssues = _mockIssues_;
      github.db.getInstance(undefined, false).then(function(_db_) {
        db = _db_;
      }).then(done);
    });
  });


  beforeEach(function() {
    Issues = LocalModelCollection('Issues', db);
  });


  describe('.subscribe()', function() {
    it('should return an observable', function() {
      // expect(Issues.subscribe().observer).not.toBeUndefined();
    });


    //It's using Array.observe semantics. Need to think about how we want to expose this to the user.
    it('should notify the observable when the Lovefield data changes for the specified query',
        function(done) {
      var time = (new Date).getTime();
      var successSpy = jasmine.createSpy('success');
      var errorSpy = jasmine.createSpy('error');
      var doneSpy = jasmine.createSpy('done');
      setTimeout(function() {
        //dump(successSpy.calls.argsFor(0)[0])
        expect(successSpy.calls.count()).toBe(1);
        done();
      }, 100);

      Issues.subscribe({id: time}).subscribe(successSpy, errorSpy, doneSpy);

      var table = db.getSchema().getIssues();
      var issue1 = angular.copy(mockIssues()[29]);
      issue1.id = time;
      issue1.assignee = issue1.assignee || -1;
      issue1.milestone = issue1.milestone || -1;
      issue1.created_at = new Date(issue1.created_at);
      issue1.updated_at = new Date(issue1.updated_at);
      var issue2 = angular.copy(issue1);
      issue2.id = time+1;
      var rows = [table.createRow(issue1), table.createRow(issue2)];
      db.
        insertOrReplace().
        into(table).
        values(rows).
        exec().then(console.log.bind(console), function(e) {
          console.error(e.stack);
        })
    });
  });
});
