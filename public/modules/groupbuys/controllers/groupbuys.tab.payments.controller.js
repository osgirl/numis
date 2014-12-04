'use strict';

// Payments tab controller
angular.module('groupbuys').controller('groupbuys.tab.payments.controller', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
