(function() {

angular.module('ghoStateFilterDirective', []).
  directive('stateFilter', ['$location', function($location) {
    return {
      scope: false,
      link: function(scope, el, attrs) {
        scope.states = ['all','open','closed'];
        Rx.Observable.fromEvent(el[0], 'click').
          filter(function(evt) {
            return evt && evt.target && evt.target.nodeName === 'BUTTON';
          }).
          map(function(evt) {
            return evt.target.value;
          }).subscribe(function(state) {
            scope.$apply(function(){
              $location.search('state', state);
            });

          });
      },
      restrict: 'E',
      template:'\
        <div class="btn-group" role="group" aria-label="issue state filter buttons">\
          <button class="btn btn-default"\
                  ng-class="{\'active\':state == $parent.stateFilter}"\
                  ng-repeat="state in states"\
                  value="{{state}}">\
            {{state}}\
          </button>\
        </div>\
      '
    }
  }]);

}());
