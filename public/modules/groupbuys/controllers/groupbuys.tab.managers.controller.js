'use strict';

// Managers tab controller
angular.module('groupbuys').controller('GroupbuysTabManagersController', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;

    $scope.filterUsers = '';

    // Users list
    
//TODO - Pedirla por $http
    $scope.usersList = ['dj blue', 'tapi', 'cabragitana', '547d82a47337f1a50ccc53f2', '547d82a47337f1a50ccc53f3'];

    // Delete the managers from the user list
    $scope.groupbuy.managers.forEach(function(manager) {
        var i = $scope.usersList.indexOf(manager);
        if(i !== -1) {
            $scope.usersList.splice(i, 1);
        }
    });

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabManagersController.$deleteManager
    * @methodOf groupbuys.controller:GroupbuysTabManagersController

    @description
    * Deletes a manager from the groupbuy.
    */
    $scope.deleteManager = function(managerId) {

        if (managerId !== '' ) {

            if ($scope.groupbuy.managers.length > 1 ) {

                 var i = $scope.groupbuy.managers.indexOf(managerId);
                 if(i !== -1) {
                     // add and delete from scope lists
                     $scope.groupbuy.managers.splice(i, 1);
                     $scope.usersList.push(managerId);

                     // save
                     $scope.update();
                 }
            } else {
                $scope.error = 'No se puede eliminar el ultimo gestor';
            }
        }
    };

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabManagersController.$addManager
    * @methodOf groupbuys.controller:GroupbuysTabManagersController

    @description
    * Deletes a manager from the groupbuy.
    */
    $scope.addManager = function(managerId) {
        if (managerId !== '' ) {
            // add and delete from $scope lists
            $scope.groupbuy.managers.push(managerId);
            var i = $scope.usersList.indexOf(managerId);
            if(i !== -1) {
                $scope.usersList.splice(i, 1);
            }
            // save
            $scope.update();
        }
    };


 }
]);
