angular.module('ghoHooks', ['ghoFirebaseAuth']).
  factory('githubHookFactory', ['$q', '$http', function ($q, $http) {

    /*
      Create a formatted URL for Github hooks

      Format: 'https://api.github.com/repos/:user/:repo/hooks?access_token=:accessToken'
      Example: 'https://api.github.com/repos/jeffbcross/offline-github/hooks?access_token=SECRET_TOKEN'

      hookUrlParams
        user        - The user who owns the repository
        repo        - The repository for the hook
        accessToken - The token to provide hook creation access
     */
    function formatHookUrl(hookUrlParams) {
      var baseString = 'https://api.github.com/repos/' +
        hookUrlParams.user +
        '/' +
        hookUrlParams.repo +
        '/hooks?access_token=' +
        hookUrlParams.accessToken;

      return baseString;
    }

    /*
      Create a Github hook

      Make a call out to the GitHub API to programmatically make a hook.

      hookParams
        user        - The user who owns the repository
        repo        - The repository for the hook
        accessToken - The token to provide hook creation access
        payloadUrl  - The URL that will receive and store the payload from GitHub
        events      - A string array of GitHub hook events (https://developer.github.com/webhooks/#events)

      returns a promise that contains the response from Github

      Example:
        // Create a hook to jeffbcross's 'github-offline' repo that listens for comments on issues and stores the
        // data to a Firebase
        createHook({
          user: 'jeffbcross',
          repo: 'github-offline',
          accessToken: 'SUPER_SECRET_TOKEN',
          payloadUrl: '',
          events: ['issue_comment']
        });
     */
    var createHook = function createHook(hookParams) {
      $http.post(formatHookUrl(hookParams), {
          name: 'web',
          config: {
            active: true,
            url: params.payloadUrl,
            content_type: 'json'
          },
          events: params.events
        });
    };

    // export function for testing
    createHook.formatHookUrl = formatHookUrl;

    return createHook;
  }]).

  /*
    Create a specific Github hook for jeffbcross/offline-github

    He's basically the boss of the hooks.

    hookParams
      payloadUrl  - The URL that will receive and store the payload from GitHub
      events      - A string array of GitHub hook events (https://developer.github.com/webhooks/#events)

    returns a promise that contains the response from Github

    Example:
    var promise = captainHook({
      payloadUrl: 'https://gh-offline.firebaseio.com/issues/.json',
      events: ['issue_comment']
    });

   */
  factory('captainHook', ['firebaseAuth', 'githubHookFactory', function(firebaseAuth, githubHookFactory) {

    return function captainHook(hookParams) {
      return githubHookFactory({
        user: 'jeffbcross',
        repo: 'offline-github',
        accessToken: firebaseAuth.getAuth().github.accessToken,
        payloadUrl: hookParams.payloadUrl,
        events: hookParams.events
      });
    };

  }]);