describe('lovefieldQueryBuilder', function() {
  var queryBuilder, issuesSchema;

  beforeEach(function(done) {
    module('ghoLovefieldQueryFactory');
    inject(function(lovefieldQueryBuilder){
      queryBuilder = lovefieldQueryBuilder;
    });
    github.db.getInstance().then(function(db) {
      issuesSchema = db.getSchema().getIssues();
    }).then(done);
  });


  it('should return undefined if input is undefined', function() {
    expect(queryBuilder(issuesSchema)).toBeUndefined();
  });


  it('should return undefined if no properties are provided on object',
      function() {
    expect(queryBuilder(issuesSchema, {})).toBeUndefined();
  });


  it('should return undefined if provided query keys do not exist in schema',
      function() {
    expect(queryBuilder(issuesSchema, {age: 30})).toBeUndefined();
  });


  it('should return an unwrapped predicate if only one key matches',
      function() {
    var query = queryBuilder(issuesSchema, {owner: 5});
    expect(query.column.name_).toBe('owner');
    expect(query.children_).toBeNull();
  });


  it('should return a wrapped predicate if query contains 2 or more conditions',
      function() {
    expect(
        queryBuilder(
            issuesSchema,
            {id: 0, owner: 1}).children_.length).
      toBe(2);
    expect(
        queryBuilder(
            issuesSchema,
            {id: 0, owner: 1, repository: 'foo'}).children_.length).
      toBe(3);
    expect(
        queryBuilder(
            issuesSchema,
            {id: 0}).children_).
      toBeNull();
  });
});
