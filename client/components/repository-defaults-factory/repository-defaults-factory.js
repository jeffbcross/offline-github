(function() {

function repositoryDefaultsFactory() {
  return function () {
    return {
      permissions: {
        transformer: 'prop:admin'
      },
      owner: {
        transformer: 'prop:login'
      },
      description: {
        defaultValue: ''
      },
      mirror_url: {
        defaultValue: ''
      },
      pushed_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      created_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      updated_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      homepage: {
        defaultValue: ''
      }
    }
  }
}

angular.module('ghoRepositoryDefaultsFactory', []).
  factory('repositoryDefaults', [repositoryDefaultsFactory]);

}());
