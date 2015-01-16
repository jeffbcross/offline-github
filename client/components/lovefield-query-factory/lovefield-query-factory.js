(function(){

function lovefieldQueryBuilderFactory() {
  return function lovefieldQueryBuilder(schema, query){
    var normalizedQuery = [];
    var count = 0;
    for (var key in query) {
      if (query.hasOwnProperty(key) && schema[key]) {
        count++
        normalizedQuery.push(schema[key].eq(query[key]));
      }
    }

    if (!count) {
      return;
    }
    else if (count === 1) {
      return normalizedQuery[0];
    }
    else {
      return lf.op.and.apply(null, normalizedQuery);
    }
  };
}

angular.module('ghoLovefieldQueryFactory', []).
  factory('lovefieldQueryBuilder', [lovefieldQueryBuilderFactory]);


}());
