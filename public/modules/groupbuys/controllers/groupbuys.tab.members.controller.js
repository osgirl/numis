'use strict';

/**
 * @ngdoc controller
 * @name groupbuys.controller:GroupbuysTabMembersController
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
 * Members tab controller
 */
angular.module('groupbuys').controller('GroupbuysTabMembersController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;


    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabMembersController.$scope.loadMembersData
    * @methodOf groupbuys.controller:GroupbuysTabMembersController
    *
    * @description
    * Loads the members data and set the visibility of the list.
    */
    $scope.loadMembersData = function() {

        // Members list
        $scope.visibility.show_members_list = false;

        if ($scope.userRole === 'manager') {
            $scope.visibility.show_members_list = true;
        } else if ($scope.groupbuy.visibility.members === 'public') {
            $scope.visibility.show_members_list = true;
        } else if ($scope.userRole === 'member' && $scope.groupbuy.visibility.members === 'restricted') {
            $scope.visibility.show_members_list = true;
        }

        // Member items
        $scope.visibility.show_members_items = false;

        if ($scope.userRole === 'manager') {
            $scope.visibility.show_members_items = true;
        } else if ($scope.groupbuy.visibility.itemsByMember === 'public') {
            $scope.visibility.show_members_items = true;
        } else if ($scope.userRole === 'member' && $scope.groupbuy.visibility.itemsByMember === 'restricted') {
            $scope.visibility.show_members_items = true;
        }

        // Load members list data if it's necessary
        if ($scope.visibility.show_members_list) {

            var usersData = Restangular.one('groupbuys',$stateParams.groupbuyId).all('members').getList();

            usersData.then(function(data) {

                var members_extended_data = [];

                for (var i=0; i<data.length; i++) {

                    var element = [];

                    element._id = data[i]._id;
                    element.username = data[i].username;
                    element.avatar = data[i]._links.avatar.href;

                    members_extended_data.push(element);
                }

                $scope.groupbuy.members_extended_data = members_extended_data;

            }, function errorCallback() {
                // TODO translate this key and don't use alert
                alert('Error getting data from server');
            });

        }

/*        // Load members items data if it's necessary
        if ($scope.visibility.show_members_items) {




        }
*/
    };

    // ----------------------

 }
]);
