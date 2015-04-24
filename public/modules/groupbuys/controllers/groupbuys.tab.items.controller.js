'use strict';

// Items tab controller
angular.module('groupbuys').controller('GroupbuysTabItemsController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys', '$window',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys, $window) {
    $scope.authentication = Authentication;

    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.$scope.loadItemsData
    * @methodOf groupbuys.controller:GroupbuysTabItemsController
    *
    * @description
    * Loads the items data and set the visibility of the list.
    */
    $scope.loadItemsData = function() {

        // Other vars
        $scope.addNewItemHide = true;

        // Currencies
        Restangular.all('currencies').getList().then(function(data) {

                $scope.groupbuy.currenciesList = data;

        }, function errorCallback() {
            console.log('error aqui');
            $scope.error = $translate.instant('core.Error_connecting_server');
        });


        // Groupbuy items
        Restangular.one('groupbuys',$stateParams.groupbuyId).all('items').getList().then(function(data) {

            $scope.groupbuy.items = data;

            if ($scope.userRole === 'member' ){

                // Create a request for all items
                $scope.request = [];
                for ( var i=0; i<$scope.groupbuy.items.length; i++ ) {

                    var itemId = $scope.groupbuy.items[i]._id;
                    //$scope.request.push(itemId);
                    $scope.request[itemId] = 0;
                }

                // Populate the request for the requested ones
                Restangular.one('groupbuys',$stateParams.groupbuyId).one('users',$scope.authentication.user._id).one('orders').getList().then(function(data) {

                    // Populate requested items
                    for ( var i=0; i<data[0].summary.length; i++ ) {

                        var itemId = data[0].summary[i].item;
                        var itemQuantity = data[0].summary[i].quantity;

                        $scope.request[itemId] = itemQuantity;
                    }

                    // Populate order_id
                    $scope.orderId = data[0]._id;

                    // populate shipping data
                    // TODO

                    // populate payment data
                    $scope.payment.total = data[0].total;
                    $scope.payment.otherCosts = data[0].otherCosts;
                    $scope.payment.shippingCost = data[0].shippingCost;
                    $scope.payment.providerShippingCost = data[0].providerShippingCost;
                    $scope.payment.subtotal = data[0].subtotal;
                    $scope.payment.info = data[0].payment.info;
                    $scope.payment.infoManagers = '';
                    // //$scope.payment.infoManagers = data[0].payment.infoManagers;
                    // TODO - Get this from server:
                    $scope.payment.paid = false;
                    $scope.payment.received = false;
                    //
                    console.log ($scope.payment);

                }, function errorCallback() {
                    $scope.error = $translate.instant('core.Error_connecting_server');
                });

            } // From userRole == member

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.changeCurrency
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Saves the currency of a groupbuy.
    */
    $scope.changeCurrency = function() {
        $scope.update();
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.editItem
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Edits an item on the new item / edit area.
    */
    $scope.editItem = function(item) {
        if (item !== '' ) {
            // Load values into the edit area
            $scope.groupbuy.items.newItem = item;
            // show the edit area
            $scope.addNewItemHide = false;
            // TODO: Move focus
        }
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.cancelEdit
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Hide the new item / edit area.
    */
    $scope.cancelEdit = function() {
        $scope.addNewItemHide = true;
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.deleteItem
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Deletes an item from the groupbuy.
    */
    $scope.deleteItem = function(item) {
        if (item._id !== '' ) {
            item.remove().then(function(data) {
                // Delete from list
                var position = $scope.findPosition(item._id, $scope.groupbuy.items);
                if( position !== -1) {
                    // Delete from items list
                    $scope.groupbuy.items.splice(position, 1);
                }

            }, function(serverResponse) {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });
        }
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.saveItem
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Saves an item from the groupbuy, creating or editting it.
    */
    $scope.saveItem = function() {

        // Upload or new?
        if ($scope.groupbuy.items.newItem._id === '') {

            // Get data
            var payload = {};
            payload.title = $scope.groupbuy.items.newItem.title;
            payload.description = $scope.groupbuy.items.newItem.description;
            payload.price = $scope.groupbuy.items.newItem.price;
            payload.maxQuantity = $scope.groupbuy.items.newItem.maxQuantity;

            // Updating the server via API
            Restangular.one('groupbuys',$stateParams.groupbuyId).all('items').post(payload).then(function(data) {

                // Updating the Scope with the received data:
                $scope.groupbuy.items.push(data);

            }, function(serverResponse) {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        } else {
            $scope.groupbuy.items.newItem.save().then(function(data) {
                // All OK
            }, function(serverResponse) {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        }

        // Hide the area
        $scope.addNewItemHide = true;

    };

    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.addNewItemToogle
    * @methodOf groupbuys.controller:GroupbuysTabItemsController
    *
    * @description
    * Shows the new item / edit area.
    */
    $scope.addNewItemToogle = function(){

        // new item base model
        $scope.groupbuy.items.newItem = [];
        $scope.groupbuy.items.newItem._id = '';
        $scope.groupbuy.items.newItem.title = '';
        $scope.groupbuy.items.newItem.description = '';
        $scope.groupbuy.items.newItem.price = 0;
        $scope.groupbuy.items.newItem.maxQuantity = 0;

        $scope.addNewItemHide = false;
    };

    // ----------------------


    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.addItemRequest
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Add an item request.
    */
    $scope.addItemRequest = function(itemId) {
        if (itemId !== ''){
            var position = $scope.findPosition(itemId, $scope.groupbuy.items);

            if ( ($scope.groupbuy.items[position].available === null) || ($scope.request[itemId] < $scope.groupbuy.items[position].available) ){
                $scope.request[itemId]++ ;
            }
        }
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.removeItemRequest
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Remove an item request.
    */
    $scope.removeItemRequest = function(itemId) {
        if (itemId !== '' && $scope.request[itemId] > 0){
            $scope.request[itemId]-- ;
        }
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabItemsController.requestItems
    * @methodOf groupbuys.controller:GroupbuysTabItemsController

    @description
    * Request items to server.
    */
    $scope.requestItems = function() {

        var payload = {items: []};

        for ( var key in $scope.request) {
            var item = {
                    item:     key,
                    quantity: $scope.request[key]
            };

            payload.items.push(item);
        }

        Restangular.one('orders',$scope.orderId).post('add-request',payload).then(function(data) {

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

        $window.location.reload();

    };

    // ----------------

 }
]);
