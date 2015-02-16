'use strict';

// Information tab controller
angular.module('groupbuys').controller('GroupbuysTabInfoController', ['$scope','Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;

    $scope.newUpdate = '';


    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabInfoController.$scope.addUpdate
    * @methodOf groupbuys.controller:GroupbuysTabInfoController

    @description
    * Adds an update to the groupbuy.
    */
    $scope.addUpdate = function() {

        if ($scope.newUpdate !== '' ) {

            var elementToAdd = {};
            elementToAdd.publishDate = Date.now();
            elementToAdd.textInfo = $scope.newUpdate;

            // If it doesn't exist create it
            if (typeof $scope.groupbuy.updates === 'undefined') {
                $scope.groupbuy.updates = [];
            }

            $scope.groupbuy.updates.push(elementToAdd);

            $scope.update();

            $scope.newUpdate = ''; 
            //$location.path('groupbuys/' + $scope.groupbuy.slug + '/manage');
        }
    };



  }
]);
