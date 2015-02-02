(function() {

function organizationDefaultsFactory() {
  return function () {
    return {
      company: {
        defaultValue: ''
      },
      blog: {
        defaultValue: ''
      },
      location: {
        defaultValue: ''
      },
      email: {
        defaultValue: ''
      },
      public_repos: {
        defaultValue: -1
      },
      public_gists: {
        defaultValue: -1
      },
      followers: {
        defaultValue: -1
      },
      following: {
        defaultValue: -1
      },
      html_url: {
        defaultValue: ''
      },
      created_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      updated_at: {
        transformer: 'as_date',
        defaultValue: new Date()
      },
      type: {
        defaultValue: ''
      }
    }
  }
}

angular.module('ghoOrganizationDefaultsFactory', []).
  factory('organizationDefaults', [organizationDefaultsFactory]);

}());
