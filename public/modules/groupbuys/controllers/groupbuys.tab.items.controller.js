'use strict';

// Items tab controller
angular.module('groupbuys').controller('GroupbuysTabItemsController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
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

        // Otras variables
        $scope.addNewItemHide = true;

        // Currencies
        Restangular.all('currencies').getList().then(function(data) {

                $scope.groupbuy.currenciesList = data;

        }, function errorCallback() {
            console.log('error aqui');
            $scope.error = $translate.instant('core.Error_connecting_server');
        });


        // Items de la compra
        Restangular.one('groupbuys',$stateParams.groupbuyId).all('items').getList().then(function(data) {

                $scope.groupbuy.items = data;

                // Request items
                $scope.request = [];
                for ( var i=0; i<$scope.groupbuy.items.length; i++ ) {

                    var itemId = $scope.groupbuy.items[i]._id;
                    //$scope.request.push(itemId);
                    $scope.request[itemId] = 0;
                }


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

            if ($scope.request[itemId] < $scope.groupbuy.items[position].available){
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

        console.log('Requesting stuff');

        var payload = [];
        payload.items = [];

        for ( var key in $scope.request) {
            var item = {
                    item:     key,
                    quantity: $scope.request[key]
            };

            payload.items.push(item);
        }

        console.log( payload );

    };

    // ----------------

 }
]);
