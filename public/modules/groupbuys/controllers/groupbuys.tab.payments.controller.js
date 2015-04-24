'use strict';

// Payments tab controller
angular.module('groupbuys').controller('GroupbuysTabPaymentsController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabPaymentsController.savePaymentData
    * @methodOf groupbuys.controller:GroupbuysTabPaymentsController

    @description
    * Request items to server.
    */
    $scope.savePaymentData = function() {
        console.log ('save');
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabPaymentsController.loadAllPaymentData
    * @methodOf groupbuys.controller:GroupbuysTabPaymentsController

    @description
    * Request items to server.
    */
    $scope.loadAllPaymentData = function() {

        $scope.paymentNoteShow = false;
        $scope.paymentNote = '';

        if ($scope.userRole === 'manager' ){

            // Get all orders
            Restangular.one('groupbuys',$stateParams.groupbuyId).all('orders').getList().then(function(data) {

                $scope.allPaymentData = data;

                // add some necessary info
                for ( var i=0; i<$scope.allPaymentData.length; i++ ) {
                    var position = $scope.findPosition($scope.allPaymentData[i].user , $scope.groupbuy.members_extended_data);
                    if (position !== -1) {
                        $scope.allPaymentData[i].username = $scope.groupbuy.members_extended_data[position].username;
                    }
                }

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        } // UserRole == manager

    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabPaymentsController.saveAllPaymentData
    * @methodOf groupbuys.controller:GroupbuysTabPaymentsController

    @description
    * Request items to server.
    */
    $scope.saveAllPaymentData = function() {

        console.log ('save all');
    };

	// ----------------------

	/**
	* @ngdoc method
	* @name groupbuys.controller:GroupbuysController.$scope.showPaymentNotes
	* @methodOf groupbuys.controller:GroupbuysController
	*
	* @description
	* Toogles notes view
	*/
	$scope.showPaymentNotes = function(paymentId) {
        if (paymentId == 0) {
            $scope.paymentNoteShow = false;
        } else {
            $scope.paymentNoteShow = true;
        }

        var position = $scope.findPosition(paymentId, $scope.allPaymentData);
        if (position !== -1) {
            $scope.paymentNote = $scope.allPaymentData[position].payment.info;
        }

	};

	// ----------------------

 }
]);
