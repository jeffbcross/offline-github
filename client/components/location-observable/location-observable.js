(function() {

function paramsObservableFactory($location) {
  return function (scope, watchExpression) {
    return Rx.Observable.create(function (observer) {
      // Create function to handle old and new Value
      function listener () {
        observer.onNext(Immutable.Map($location.search()));
      }

      // Returns function which disconnects the $watch expression
      return scope.$on(watchExpression, listener);
    });
  };
}

angular.module('ghoParamsObservable', []).
  factory('paramsObservable', ['$location', paramsObservableFactory]);

}());
