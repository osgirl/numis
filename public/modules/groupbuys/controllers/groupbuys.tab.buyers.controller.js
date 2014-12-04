'use strict';

// Buyers tab controller
angular.module('groupbuys').controller('groupbuys.tab.buyers.controller', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
