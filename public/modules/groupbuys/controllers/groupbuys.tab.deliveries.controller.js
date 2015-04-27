'use strict';

/**
 * @ngdoc controller
 * @name groupbuys.controller:GroupbuysTabDeliveriesController
 *
 * @requires $scope
 * @requires $stateParams
 * @requires $translate
 * @requires $location
 * @requires Restangular
 * @requires Authentication
 * @requires Groupbuys
 *
 * @description
 * Deliveries tab controller
 */
angular.module('groupbuys').controller('GroupbuysTabDeliveriesController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {

    $scope.authentication = Authentication;
    $scope.selectedMember = null;


    $scope.loadDeliveryData = function() {
        $scope.delivery = null;

        if ($scope.userRole === 'member') {
            // Groupbuy messages for authenticated user
            Restangular.one('groupbuys',$stateParams.groupbuyId).one('users', $scope.authentication.user._id).all('orders').getList().then(function(data) {
                if (typeof data !== 'undefined' && typeof data[0] !== 'undefined') {
                    $scope.delivery = data[0].shipping;
                    $scope.orderId = data[0]._id;
                } else {
                    $scope.delivery = {};
                    $scope.orderId = null;
                }

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        } else if ($scope.selectedMember) {
            // Groupbuy messages for selected user
            Restangular.one('groupbuys',$stateParams.groupbuyId).one('users', $scope.selectedMember._id).all('orders').getList().then(function(data) {
                if (typeof data !== 'undefined' && typeof data[0] !== 'undefined') {
                    $scope.delivery = data[0].shipping;
                    $scope.orderId = data[0]._id;
                } else {
                    $scope.delivery = {};
                    $scope.orderId = null;
                }

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        }

    };


    $scope.copyHomeAdress = function() {
        $scope.delivery.address = $scope.authentication.user.homeAddress;
    };

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabDeliveriesController.$scope.saveDelivery
    * @methodOf groupbuys.controller:GroupbuysTabDeliveriesController

    @description
    * Saves delivery info.
    */
    $scope.saveDeliveryData = function() {
        Restangular.one('orders',$scope.orderId).all('shipping').post($scope.delivery).then(function(data) {

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

    };

    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabDeliveriesController.$scope.selectMember
    * @methodOf groupbuys.controller:GroupbuysTabDeliveriesController
    *
    * @description
    * Select active member.
    */
    $scope.selectMember = function(member) {
        $scope.selectedMember = member;

        if ($scope.lastSelected) {
            $scope.lastSelected.selected = '';
        }
        this.selected = 'selected';
        $scope.lastSelected = this;

        this.loadDeliveryData();
    };

 }
]);
