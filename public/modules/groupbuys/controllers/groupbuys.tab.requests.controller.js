'use strict';

// Buyers request tab controller
angular.module('groupbuys').controller('GroupbuysTabRequestsController', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
