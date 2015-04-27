'use strict';

/**
 * @ngdoc controller
 * @name groupbuys.controller:GroupbuysTabConfigController
 *
 * @requires $scope
 * @requires $stateParams
 * @requires $translate
 * @requires $location
 * @requires $window
 * @requires Restangular
 * @requires Authentication
 * @requires Groupbuys
 *
 * @description
 * Configuration tab controller
 */
angular.module('groupbuys').controller('GroupbuysTabConfigController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys', '$window',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys, $window) {
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

        Restangular.one('groupbuys',$stateParams.groupbuyId).all('go-to').all(newState).post().then(function(data) {
            $window.location.reload();
        }, function(serverResponse) {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });
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
