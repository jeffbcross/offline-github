angular.module('ghoMockConstant', []).
  constant('USE_MEMORY_DB', true);

angular.module('ghoMockSource', []).
  factory('MockSource', [function(){
    return function MockSource(){

    };
  }])
