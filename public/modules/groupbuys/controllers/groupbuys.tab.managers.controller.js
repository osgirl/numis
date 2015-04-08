'use strict';

// Managers tab controller
angular.module('groupbuys').controller('GroupbuysTabManagersController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabManagersController.$loadManagersData
    * @methodOf groupbuys.controller:GroupbuysTabManagersController

    @description
    * Loads managers list and users list if it's necessary.
    */
    $scope.loadManagersData = function() {

        // Initialize required vars
        $scope.filterUsers = '';
        $scope.groupbuy.usersList = [];

        // Get all managers
        var usersData = Restangular.one('groupbuys',$stateParams.groupbuyId).all('managers').getList();

        usersData.then(function(data) {
            var managersList = [];
            for (var i=0; i<data.length; i++) {
                var element = [];
                element._id = data[i]._id;
                element.username = data[i].username;
                element.avatar = data[i]._links.avatar.href;

                managersList.push(element);
            }

            $scope.groupbuy.managers_extended_data = managersList;

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

        if ($scope.userRole === 'manager'){
            // Load all users list
            $scope.loadUsersList();
        }

    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabManagersController.$deleteManager
    * @methodOf groupbuys.controller:GroupbuysTabManagersController

    @description
    * Deletes a manager from the groupbuy.
    */
    $scope.loadUsersList = function() {

        if ($scope.userRole === 'manager'){

            // Get all users
            var usersData = Restangular.all('users').getList();

            usersData.then(function(data) {
                var usersList = [];
                for (var i=0; i<data.length; i++) {
                    var element = [];
                    element._id = data[i]._id;
                    element.username = data[i].username;
                    element.avatar = data[i]._links.avatar.href;

                    usersList.push(element);
                }

                // Delete the managers from the user list
                $scope.groupbuy.managers.forEach(function(managerId) {
                    var position = $scope.findPosition(managerId, usersList);
                    if( position !== -1) {
                        usersList.splice(position, 1);
                    }
                });

                $scope.groupbuy.usersList = usersList;

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        }

    };

    // ----------------

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

                // Updating the server via API
                var payload = {};
                payload.userId = managerId;

                Restangular.one('groupbuys',$stateParams.groupbuyId).one('managers',managerId).remove().then(function() {

                    // Find, add and delete from managers_extended_data
                    var position = $scope.findPosition(managerId, $scope.groupbuy.managers_extended_data);
                    if( position !== -1) {
                        $scope.groupbuy.usersList.push($scope.groupbuy.managers_extended_data[position]);
                        $scope.groupbuy.managers_extended_data.splice(position, 1);
                    }

                    // Find and delete from managers
                    var i = $scope.groupbuy.managers.indexOf(managerId);
                    if(i !== -1) {
                        $scope.groupbuy.managers.splice(i, 1);
                    }

                    // NOTES: Still being an member
                    //        No need to save as the manager is updated via API

                }, function(serverResponse) {
                    $scope.error = $translate.instant('core.Error_connecting_server');
                });

            } else {
                $scope.error = $translate.instant('groupbuys.Last_manager_cannot_be_deleted');
            }
        }
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabManagersController.$addManager
    * @methodOf groupbuys.controller:GroupbuysTabManagersController

    @description
    * Deletes a manager from the groupbuy.
    */
    $scope.addManager = function(managerId) {
        if (managerId !== '' ) {

            // Updating the server via API
            var payload = {};
            payload.userId = managerId;

            Restangular.one('groupbuys',$stateParams.groupbuyId).all('managers').post(payload).then(function() {

                // Updating the Scope with the required data:
                // Find element in extended lists
                var position = $scope.findPosition(managerId, $scope.groupbuy.usersList);

                if( position !== -1) {

                    // Add the found user to simple lists
                    $scope.groupbuy.managers.push(managerId);
                    $scope.groupbuy.members.push(managerId);

                    // Add the found user to extended lists
                    $scope.groupbuy.managers_extended_data.push($scope.groupbuy.usersList[position]);
                    $scope.groupbuy.members_extended_data.push($scope.groupbuy.usersList[position]);


                    // Delete from users list
                    $scope.groupbuy.usersList.splice(position, 1);
                }

                // NOTE: No need to save as the manager is updated via API

            }, function(serverResponse) {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        }
    };

    // ----------------

 }
]);
