'use strict';

// Configuration tab controller
angular.module('groupbuys').controller('GroupbuysTabConfigController', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
