'use strict';

// Information tab controller
angular.module('groupbuys').controller('groupbuys.tab.info.controller', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;

    $scope.newUpdate = '';


    /*
    @ngdoc method
    * @name groupbuys.controller:groupbuys.tab.info.controller.$addUpdate
    * @methodOf groupbuys.controller:groupbuys.tab.info.controller

    @description
    * Adds an update to the groupbuy.
    */
    $scope.addUpdate = function() {

        var elementToAdd = {};
        elementToAdd.publishDate = Date.now();
        elementToAdd.textInfo = $scope.newUpdate;

        $scope.groupbuy.updates.push(elementToAdd);

        $scope.update();
        $location.path('groupbuys/' + $scope.groupbuy.slug + '/manage');
    };



  }
]);
