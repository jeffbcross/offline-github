angular.module('ghoFirebaseAuth', []).
  service('firebaseAuth', ['$q', function($q) {
    var ref = new Firebase("https://gh-offline.firebaseio.com");
    this.githubAuth = function() {
      if (ref.getAuth()) return $q.when(ref.getAuth());

      var deferred = $q.defer();
      ref.authWithOAuthPopup("github", function(error, authData) {
        if (error) {
          deferred.reject(error);
        } else {
          deferred.resolve(authData);
        }
      });

      return deferred.promise;
    };

    this.logOut = function() {
      ref.unauth();
    };
  }]);
