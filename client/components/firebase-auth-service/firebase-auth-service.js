angular.module('ghoFirebaseAuth', []).
  service('firebaseAuth', ['$q', '$rootScope', function($q, $rootScope) {
    var ref = new Firebase("https://gh-offline.firebaseio.com");
    this.getRouteAuth = function () {
      var auth = ref.getAuth();
      if (auth) {
        return $q.when(auth)
      } else {
        $rootScope.$emit('$loginCheckFailed');
        return $q.reject(auth);
      }
    };

    this.getAuth = function() {
      return ref.getAuth();
    }

    this.githubAuth = function() {
      if (ref.getAuth()) return $q.when(ref.getAuth());

      var deferred = $q.defer();
      ref.authWithOAuthPopup("github", function(error, authData) {
        if (error) {
          deferred.reject(error);
        } else {
          deferred.resolve(authData);
        }
      },
      {
        scope: 'read:org'
      });

      return deferred.promise;
    };

    this.logOut = function() {
      console.log('logout');
      ref.unauth();
    };
  }]);
