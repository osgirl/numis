'use strict';

// Deliveries tab controller
angular.module('groupbuys').controller('GroupbuysTabDeliveriesController', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
