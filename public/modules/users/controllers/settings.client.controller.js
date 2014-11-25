'use strict';

/**
 * @ngdoc controller
 * @name users.controller:SettingsController
 *
 * @requires $cope
 * @requires $http
 * @requires $location
 * @requires users.service:Users
 * @requires users.service:Authentication
 *
 * @description
 * Password controller
 */

angular.module('users').controller('SettingsController', ['$scope', '$http', '$location', 'Users', 'Authentication',
	function($scope, $http, $location, Users, Authentication) {
		$scope.user = Authentication.user;

		// If user is not signed in then redirect back home
		if (!$scope.user) $location.path('/');

		/**
		* @ngdoc method
		* @name users.controller:SettingsController.$scope·hasConnectedAdditionalSocialAccounts
		* @methodOf users.controller:SettingsController
		*
		* @description
		* Check if there are additional accounts
		*/
		$scope.hasConnectedAdditionalSocialAccounts = function(provider) {
			for (var i in $scope.user.additionalProvidersData) {
				return true;
			}

			return false;
		};

		/**
		* @ngdoc method
		* @name users.controller:SettingsController.$scope·isConnectedSocialAccount
		* @methodOf users.controller:SettingsController
		*
		* @description
		* Check if provider is already in use with current user
		*/
		$scope.isConnectedSocialAccount = function(provider) {
			return $scope.user.provider === provider || ($scope.user.additionalProvidersData && $scope.user.additionalProvidersData[provider]);
		};

		/**
		* @ngdoc method
		* @name users.controller:SettingsController.$scope·removeUserSocialAccount
		* @methodOf users.controller:SettingsController
		*
		* @description
		* Remove a user social account
		*/
		$scope.removeUserSocialAccount = function(provider) {
			$scope.success = $scope.error = null;

			$http.delete('/users/accounts', {
				params: {
					provider: provider
				}
			}).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.user = Authentication.user = response;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};

		/**
		* @ngdoc method
		* @name users.controller:SettingsController.$scope·updateUserProfile
		* @methodOf users.controller:SettingsController
		*
		* @description
		* Update a user profile
		*/
		$scope.updateUserProfile = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				var user = new Users($scope.user);

				user.$update(function(response) {
					$scope.success = true;
					Authentication.user = response;
				}, function(response) {
					$scope.error = response.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		/**
		* @ngdoc method
		* @name users.controller:SettingsController.$scope·changeUserPassword
		* @methodOf users.controller:SettingsController
		*
		* @description
		* Change user password
		*/
		$scope.changeUserPassword = function() {
			$scope.success = $scope.error = null;

			$http.post('/users/password', $scope.passwordDetails).success(function(response) {
				// If successful show success message and clear form
				$scope.success = true;
				$scope.passwordDetails = null;
			}).error(function(response) {
				$scope.error = response.message;
			});
		};
	}
]);