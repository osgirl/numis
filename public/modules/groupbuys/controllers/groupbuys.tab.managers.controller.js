'use strict';

// Managers tab controller
angular.module('groupbuys').controller('groupbuys.tab.managers.controller', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;
 }
]);
