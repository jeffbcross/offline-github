(function() {

function issueDefaultsFactory() {
  return function (owner, repository) {
    return {
      assignee: {
        defaultValue: -1
      },
      milestone: {
        transformer: 'prop:id',
        defaultValue: -1
      },
      user: {
        transformer: 'prop:id',
        defaultValue: -1
      },
      created_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      updated_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      closed_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      owner: {
        defaultValue: owner
      },
      repository: {
        defaultValue: repository
      },
      body: {
        defaultValue: ''
      }
    }
  }
}

angular.module('ghoIssueDefaultsFactory', []).
  factory('issueDefaults', [issueDefaultsFactory]);

}());
