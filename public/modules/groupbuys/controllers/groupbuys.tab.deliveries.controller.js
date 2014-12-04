'use strict';

// Deliveries tab controller
angular.module('groupbuys').controller('groupbuys.tab.deliveries.controller', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
