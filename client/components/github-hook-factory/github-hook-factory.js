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
      var deferred = $q.defer();
      $http.post(formatHookUrl(hookParams), {
          name: 'web',
          config: {
            active: true,
            url: hookParams.payloadUrl,
            content_type: 'json'
          },
          events: hookParams.events
        })
        .success(function(data) {
          deferred.resolve(data);
        })
        .error(function(data) {
          deferred.reject(data);
        });
      return deferred.promise;
    };

    // export function for testing
    createHook.formatHookUrl = formatHookUrl;

    return createHook;
  }]).

  /*
    Create a Github hook for an authenticated user. This factory uses Firebase auth to get the username
    and access token to fill out the request.

    This is basically the coolest hook.

    hookParams
      repo        - The Github Repository to set the hook on
      payloadUrl  - The URL that will receive and store the payload from GitHub
      events      - A string array of GitHub hook events (https://developer.github.com/webhooks/#events)

    returns a promise that contains the response from Github

    Example:
    var promise = captainHook({
      repo: 'gh-offline',
      payloadUrl: 'https://gh-offline.firebaseio.com/issues/.json',
      events: ['issue_comment']
    });

   */
  factory('captainHook', ['firebaseAuth', 'githubHookFactory', function(firebaseAuth, githubHookFactory) {

    return function captainHook(hookParams) {
      var authData = firebaseAuth.getAuth();
      var hookPromise = githubHookFactory({
        user: authData.github.username,
        repo: hookParams.repo,
        accessToken: authData.github.accessToken,
        payloadUrl: hookParams.payloadUrl,
        events: hookParams.events
      });
      return hookPromise;
    };

  }]);