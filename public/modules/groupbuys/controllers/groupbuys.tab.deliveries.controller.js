'use strict';

// Deliveries tab controller
angular.module('groupbuys').controller('GroupbuysTabDeliveriesController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {

    $scope.authentication = Authentication;


    $scope.loadDeliveriesData = function(){
        // TODO Donde poner esto?
        $scope.authentication.user.deliveryAddress = '';
    };


    $scope.copyHomeAdress = function(){
        // TODO Cambiar el scope.user.deliveryAddress
        $scope.authentication.user.deliveryAddress = $scope.authentication.user.homeAddress;
    };


 }
]);
