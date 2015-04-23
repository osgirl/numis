'use strict';

// Messaging tab controller
angular.module('groupbuys').controller('GroupbuysTabMessagingController', ['$scope', 'Restangular', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
  function($scope, Restangular, $stateParams, $location, $translate, Authentication, Groupbuys) {

    $scope.authentication = Authentication;
    $scope.selectedMember = null;

    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabMessagingController.$scope.loadMessagesData
    * @methodOf groupbuys.controller:GroupbuysTabMessagingController
    *
    * @description
    * Loads the messages.
    */
    $scope.loadMessagesData = function() {
        if ($scope.userRole === 'member') {
            // Groupbuy messages for authenticated user
            Restangular.one('groupbuys',$stateParams.groupbuyId).all('messages').getList().then(function(data) {
                $scope.messages = data;

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        } else if ($scope.selectedMember) {
            // Groupbuy messages for selected user
            Restangular.one('groupbuys',$stateParams.groupbuyId).one('member',$scope.selectedMember._id).all('messages').getList().then(function(data) {
                $scope.messages = data;

            }, function errorCallback() {
                $scope.error = $translate.instant('core.Error_connecting_server');
            });

        }

    };

    // ----------------------

    /**
    * @ngdoc method
    * @name groupbuys.controller:GroupbuysTabMessagingController.$scope.selectDestMember
    * @methodOf groupbuys.controller:GroupbuysTabMessagingController
    *
    * @description
    * Loads the messages.
    */
    $scope.selectDestMember = function(member) {
        $scope.selectedMember = member;

        if ($scope.lastSelected) {
            $scope.lastSelected.selected = '';
        }
        this.selected = 'selected';
        $scope.lastSelected = this;

        this.loadMessagesData();
    };

    // ----------------------

    /**
    @ngdoc method
    * @name groupbuys.controller:GroupbuysTabMessagingController.sendMessage
    * @methodOf groupbuys.controller:GroupbuysTabMessagingController

    @description
    * Send a message to another member
    */
    $scope.sendMessage = function() {
        // Sending new message to the server via API
        var message = {};
        message.from = $scope.authentication.user._id;
        message.text = $scope.messageText;

        if ($scope.userRole === 'manager' && typeof $scope.selectedMember._id !== 'undefined')
            message.to = $scope.selectedMember._id;

        Restangular.one('groupbuys',$stateParams.groupbuyId).all('messages').post(message).then(function(data) {
            // Add message to conversation

            var newMessage = {
                    from: $scope.authentication.user.username,
                    to:   $scope.selectedMember.username,
                    text: message.text,
                    date: Date.now()
            };
            $scope.messages.push(newMessage);


            // Clean text field
            $scope.messageText = '';

        }, function errorCallback() {
            $scope.error = $translate.instant('core.Error_connecting_server');
        });

    };
 }
]);