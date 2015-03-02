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

        // Tasa de cambio

        // Items de la compra
        Restangular.one('groupbuys',$stateParams.groupbuyId).all('items').getList().then(function(data) {

                //for (var i=0; i<data.length; i++) {}

                $scope.groupbuy.items = data;

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

    };

    // ----------------------

//        if ($scope.userRole === 'manager'){


 }
]);
