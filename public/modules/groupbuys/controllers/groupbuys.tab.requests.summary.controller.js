'use strict';

// All buyers requests summary tab controller
angular.module('groupbuys').controller('GroupbuysTabRequestsSummaryController', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
