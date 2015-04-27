'use strict';

// Payments tab controller
angular.module('groupbuys').controller('GroupbuysTabPaymentsController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {

      $scope.authentication = Authentication;
      $scope.selectedMember = null;

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabPaymentsController.loadPaymentData
    * @methodOf groupbuys.controller:GroupbuysTabPaymentsController

    @description
    * Request items to server.
    */
    $scope.loadPaymentData = function() {
        $scope.order = {
            id:           null,
            subtotal:     0,
            providerShippingCost: 0,
            shippingCost: 0,
            otherCosts:   0,
            total:        0,
            payment:      {}
        };

        console.log('$scope.userRole:', $scope.userRole);
        console.log('$scope.selectedMember:', $scope.selectedMember);

        if ($scope.userRole === 'member') {
            console.log('member');
            // Groupbuy messages for authenticated user
            Restangular.one('groupbuys',$stateParams.groupbuyId).one('users', $scope.authentication.user._id).all('orders').getList().then(function(data) {
                if (typeof data !== 'undefined' && typeof data[0] !== 'undefined') {
                    $scope.order = {
                        id:           data[0]._id,
                        subtotal:     data[0].subtotal,
                        providerShippingCost: data[0].providerShippingCost,
                        shippingCost: data[0].shippingCost,
                        otherCosts:   data[0].otherCosts,
                        total:        data[0].total,
                        payment:      data[0].payment
                    };
                }

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        } else if ($scope.selectedMember) {
            console.log('manager');
            // Groupbuy messages for selected user
            Restangular.one('groupbuys',$stateParams.groupbuyId).one('users', $scope.selectedMember._id).all('orders').getList().then(function(data) {
                if (typeof data !== 'undefined' && typeof data[0] !== 'undefined') {
                    $scope.order = {
                        id:           data[0]._id,
                        subtotal:     data[0].subtotal,
                        providerShippingCost: data[0].providerShippingCost,
                        shippingCost: data[0].shippingCost,
                        otherCosts:   data[0].otherCosts,
                        total:        data[0].total,
                        payment:      data[0].payment
                    };
                }

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        }

    };

	// ----------------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabPaymentsController.$scope.savePayment
    * @methodOf groupbuys.controller:GroupbuysTabPaymentsController

    @description
    * Saves payment info.
    */
    $scope.savePayment = function(memberId) {
        // Save shipping and other costs
        var orderData = {
            shippingCost: $scope.order.shippingCost,
            otherCosts:   $scope.order.otherCosts
        };

        Restangular.one('orders',$scope.order.id).put(orderData).then(function(data) {
            $scope.order.subtotal             = data.subtotal;
            $scope.order.providerShippingCost = data.providerShippingCost;
            $scope.order.shippingCost         = data.shippingCost;
            $scope.order.otherCosts           = data.otherCosts;
            $scope.order.total                = data.total;

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

        // Save payment info
        Restangular.one('orders',$scope.order.id).all('payment').post($scope.order.payment).then(function(data) {


        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });
    };

    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabPaymentsController.$scope.selectMember
    * @methodOf groupbuys.controller:GroupbuysTabPaymentsController
    *
    * @description
    * Select active payment.
    */
    $scope.selectMember = function(member) {
        $scope.selectedMember = member;

        if ($scope.lastSelected) {
            $scope.lastSelected.selected = '';
        }
        this.selected = 'selected';
        $scope.lastSelected = this;

        this.loadPaymentData();
    };

 }
]);
