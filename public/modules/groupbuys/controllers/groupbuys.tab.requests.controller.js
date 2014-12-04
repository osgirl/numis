'use strict';

// Buyers request tab controller
angular.module('groupbuys').controller('groupbuys.tab.requests.controller', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
