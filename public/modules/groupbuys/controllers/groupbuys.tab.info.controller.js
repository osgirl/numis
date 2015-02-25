'use strict';

// Information tab controller
angular.module('groupbuys').controller('GroupbuysTabInfoController', ['$scope','Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {
    $scope.authentication = Authentication;

    $scope.newUpdate = '';

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabInfoController.$scope.addUpdate
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
    * @name groupbuys.controller:GroupbuysTabInfoController.$scope.joinGroupbuy
    * @methodOf groupbuys.controller:GroupbuysTabInfoController

    @description
    * Adds an member to the groupbuy.
    */
    $scope.joinGroupbuy = function() {
        console.log ('UNIRSE A LA COMPRA');
        // TODO
        //$location.path('groupbuys/' + $stateParams.groupbuyId );
    };

    // ----------------

    /*
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabInfoController.$scope.leaveGroupbuy
    * @methodOf groupbuys.controller:GroupbuysTabInfoController

    @description
    * Removes an member from the groupbuy.
    */
    $scope.leaveGroupbuy = function() {
        console.log (' ABANDONAR COMPRA');
        // TODO
        //$location.path('groupbuys/);
    };



    // ----------------

  }
]);
