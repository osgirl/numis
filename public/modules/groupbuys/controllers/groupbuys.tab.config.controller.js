'use strict';

// Configuration tab controller
angular.module('groupbuys').controller('GroupbuysTabConfigController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;

    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabConfigController.$scope.loadConfig
    * @methodOf groupbuys.controller:GroupbuysTabConfigController
    *
    * @description
    * Loads the visibility options of a Groupbuy.
    */
    $scope.loadConfig = function() {

        // members
        $scope.visibility.members_public = false;
        $scope.visibility.members_restricted = false;
        $scope.visibility.members_private = false;

        switch( $scope.groupbuy.visibility.members ) {
            case 'public':
                $scope.visibility.members_public = true;
                break;
            case 'restricted':
                $scope.visibility.members_restricted = true;
                break;
            case 'private':
                $scope.visibility.members_private = true;
                break;
            default:
        }

        // itemsByMember
        $scope.visibility.itemsByMember_public = false;
        $scope.visibility.itemsByMember_restricted = false;
        $scope.visibility.itemsByMember_private = false;

        switch( $scope.groupbuy.visibility.itemsByMember ) {
            case 'public':
                $scope.visibility.itemsByMember_public = true;
                break;
            case 'restricted':
                $scope.visibility.itemsByMember_restricted = true;
                break;
            case 'private':
                $scope.visibility.itemsByMember_private = true;
                break;
            default:
        }

        // paymentStatus
        $scope.visibility.paymentStatus_restricted = false;
        $scope.visibility.paymentStatus_private = false;

        switch( $scope.groupbuy.visibility.paymentStatus ) {
            case 'restricted':
                $scope.visibility.paymentStatus_restricted = true;
                break;
            case 'private':
                $scope.visibility.paymentStatus_private = true;
                break;
            default:
        }

        // shipmentsState
        $scope.visibility.shipmentsState_restricted = false;
        $scope.visibility.shipmentsState_private = false;

        switch( $scope.groupbuy.visibility.shipmentsState ) {
            case 'restricted':
                $scope.visibility.shipmentsState_restricted = true;
                break;
            case 'private':
                $scope.visibility.shipmentsState_private = true;
                break;
            default:
        }
    }

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
    }


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
    }

    // ----------------------


 }
]);
