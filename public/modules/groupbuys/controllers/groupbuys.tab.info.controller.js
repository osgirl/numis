'use strict';

/**
 * @ngdoc controller
 * @name groupbuys.controller:GroupbuysTabInfoController
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
 * Information tab controller
 */
angular.module('groupbuys').controller('GroupbuysTabInfoController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys', '$window',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys, $window) {
    $scope.authentication = Authentication;

    $scope.newUpdate = '';

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabInfoController.addUpdate
    * @methodOf groupbuys.controller:GroupbuysTabInfoController

    @description
    * Adds an update to the groupbuy.
    */
    $scope.addUpdate = function() {

        if ($scope.newUpdate !== '' ) {

            var elementToAdd = {};
            elementToAdd.publishDate = Date.now();
            elementToAdd.textInfo = $scope.newUpdate;

            // If it doesn't exist create it
            if (typeof $scope.groupbuy.updates === 'undefined') {
                $scope.groupbuy.updates = [];
            }

            $scope.groupbuy.updates.push(elementToAdd);

            $scope.update();

            $scope.newUpdate = '';
            //$location.path('groupbuys/' + $scope.groupbuy.slug + '/manage');
        }
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabInfoController.joinGroupbuy
    * @methodOf groupbuys.controller:GroupbuysTabInfoController

    @description
    * Adds an member to the groupbuy.
    */
    $scope.joinGroupbuy = function() {

        // Updating the server via API
        var payload = {};
        payload.userId = $scope.authentication.user._id;

        Restangular.one('groupbuys',$stateParams.groupbuyId).all('members').post(payload).then(function() {
            // Reload
            $window.location.reload();

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabInfoController.leaveGroupbuy
    * @methodOf groupbuys.controller:GroupbuysTabInfoController

    @description
    * Removes an member from the groupbuy.
    */
    $scope.leaveGroupbuy = function() {

        // Updating the server via API
        var payload = {};
        payload.userId = $scope.authentication.user._id;

        Restangular.one('groupbuys',$stateParams.groupbuyId).one('members',$scope.authentication.user._id).remove().then(function() {

            // Reload
            $window.location.reload();

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

    };



    // ----------------

  }
]);
