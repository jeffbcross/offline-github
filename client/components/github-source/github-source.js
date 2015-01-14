(function() {

var githubTypesPathMap = {
  'Issues': {
    WEBHOOK: 'repos/:owner/:repository',
    GET: 'repo/:owner/:repository/issues'
  }
};

function githubSourceFactory(
    $http,
    GITHUB_API_BASE_URL,
    githubTypesPathMap,
    pathExpMerger) {
  function GithubSource(options) {
    //Expect: type
    this.paths = githubTypesPathMap[options.type];
  }

  GithubSource.prototype.find = function (query) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var resolvedUrl = GITHUB_API_BASE_URL +
          pathExpMerger(self.paths.GET, query);
      $http.get(resolvedUrl).then(resolve, reject);
    });
  };

  //TODO: Needs real implementation with some thought.
  GithubSource.prototype.save = function (items, options) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var resolvedUrl = pathExpMerger(self.paths.WEBHOOK, options);
      $http.put(resolvedUrl, items).then(resolve, reject);
    });
  };

  //Installs or updates a webhook
  GithubSource.prototype.subscribe = function(options) {
    /*jshint camelcase: false */
    /*
      name: 'web',
      config: {
        active: true,
        url: 'https://gh-offline.firebaseio.com/issues/.json',
        content_type: 'json'
      },
      events: ['issue_comment'],
      */
    $http.post(
        pathExpMerger(this.remotepathExp, options),
        {
          name: 'web',
          config: {
            active: true,
            url: options.appUrl,
            content_type: 'json'
          },
          events: options.events
        }
    );
  };

  return function (pathExp) {
    return new GithubSource(pathExp);
  };
}

function pathExpMergerFactory(){
  return function pathExpMerger(exp, values){
    var retVal = exp, match;
    while ((match = /((?:\:)[a-z]+)/g.exec(retVal))) {
      retVal = retVal.replace(match[0], values[match[0].replace(':','')]);
    }
    return retVal;
  };
}

angular.module('ghoGithubSource', []).
  value('githubTypesPathMap', githubTypesPathMap).
  constant('GITHUB_API_BASE_URL', 'https://api.github.com/').
  factory('githubSource', [
      '$http', 'GITHUB_API_BASE_URL', 'githubTypesPathMap', 'pathExpMerger',
      githubSourceFactory
  ]).
  factory('pathExpMerger', [pathExpMergerFactory]);

}());
