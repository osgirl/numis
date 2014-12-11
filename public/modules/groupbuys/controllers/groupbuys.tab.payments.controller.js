'use strict';

// Payments tab controller
angular.module('groupbuys').controller('GroupbuysTabPaymentsController', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
