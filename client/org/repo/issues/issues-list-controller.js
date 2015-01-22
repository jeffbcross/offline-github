(function(){

function IssuesListController ($http, $scope, $routeParams,
    lovefieldQueryBuilder, mockIssues, firebaseAuth) {
  $scope.issues = [];

  github.db.getInstance().
    // then(getIssues).
    // then(renderData).
    then(subscribeToIssues);
    // then(insertFakeData);
    // then(updateIssues);

  $scope.$on('$destroy', function() {
    console.log('TODO! add unobserver');
  });

  function subscribeToIssues(db) {
    var table = db.getSchema().getIssues();
    var predicate = lovefieldQueryBuilder({
      repository: $routeParams.repo,
      organization: $routeParams.org
    });

    //Get initial value
    db.select().from(table).where(predicate).exec().then(renderData);
    db.observe(db.select().from(table).where(predicate), updateData);
    console.log('done observing')
    return db;
  }

  function insertFakeData(db) {
    var table = db.getSchema().getIssues();
    var issuesInsert = mockIssues().map(function(issue) {
      return table.createRow(issueStorageTranslator(issue));
    });
    db.insertOrReplace().into(table).values(issuesInsert).exec();
    return db;
  }

  function updateIssues() {
    $http.get(
        'https://api.github.com/repos/'+
        $routeParams.org+
        '/'+
        $routeParams.repo+
        '/issues?access_token='+
        firebaseAuth.getAuth().github.accessToken).
      then(insertData).
      then(null, showError);
  }

  function insertData(res) {
    github.db.getInstance().then(function(db) {
      var table = db.getSchema().getIssues();
      var issuesInsert = res.data.map(function(issue) {
        return table.createRow(issueStorageTranslator(issue));
      });
      db.insertOrReplace().into(table).values(issuesInsert).exec();
      return db;
    });
  }

  function showError() {
    console.log('show error');
    $scope.error = 'Could not update issues from server';
  }

  function renderData(issues) {
    $scope.$apply(function() {
      $scope.issues = issues;
    })
  }

  function updateData (changes) {
    console.log('renderData', changes);
    $scope.$apply(function() {
      $scope.issues = changes[0].object;
      console.log('renderData', $scope.issues);
    })
  }


  function issueStorageTranslator(issue){
    /*jshint camelcase: false */
    var newIssue = angular.copy(issue);
    newIssue.assignee = issue.assignee || -1;
    newIssue.milestone = issue.milestone || -1;
    newIssue.created_at = new Date(issue.created_at);
    newIssue.updated_at = new Date(issue.updated_at);
    return newIssue;
  };
}

angular.module('ghIssuesApp').
  controller(
      'IssuesListController',
      ['$http', '$scope', '$routeParams', 'lovefieldQueryBuilder', 'mockIssues',
          'firebaseAuth', IssuesListController]);

}());
