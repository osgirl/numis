'use strict';

// Configuration tab controller
angular.module('groupbuys').controller('GroupbuysTabConfigController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;


    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabConfigController.$scope.changeState
    * @methodOf groupbuys.controller:GroupbuysTabConfigController
    *
    * @description
    * Changes the state of a Groupbuy.
    */
    $scope.changeState = function(newState) {

        console.log('estado: '+newState);
    };


    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabConfigController.$scope.updateSettings
    * @methodOf groupbuys.controller:GroupbuysTabConfigController
    *
    * @description
    * Saves the settings for a groupbuy.
    */
    $scope.updateSettings = function( key, status ) {

        $scope.groupbuy.visibility[key] = status;
        $scope.loadConfig();
        $scope.update();
    };

    // ----------------------


 }
]);
