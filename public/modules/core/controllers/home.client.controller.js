'use strict';

/**
 * @ngdoc controller
 * @name core.controller:HomeController
 *
 * @requires $cope
 * @requires users.service:Authentication
 *
 * @description
 * Home page controller
 */

angular.module('core').controller('HomeController', ['$scope', 'Restangular', '$location', '$translate', 'Authentication',
	function($scope, Restangular, $location, $translate, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;

		$scope.cookiePolicyHide = true;
		$scope.cookiePolicyView = false;

		// ----------------------

		/**
		* @ngdoc method
		* @name core.controller:HomeController.$scope.loadHomeData
		* @methodOf core.controller:HomeController
		*
		* @description
		* Loads the required data for the home page.
		*/
		$scope.loadHomeData = function(){
			if ($scope.authentication.user) {

				// Compras nuevas
				Restangular.all('groupbuys').getList().then(function(data) {

					for (var i=0; i<data.length; i++) {
						// Add the real URL to the elements
						data[i].restangularUrl = data[i].getRequestedUrl();

						// Crop the description
						data[i].description = data[i].description.replace(/<[^>]+>/gm, '');
						data[i].description = data[i].description.substring(0, 20) + '...';
					}

					$scope.allGroupbuys = data;

				}, function errorCallback() {
		            $scope.error = $translate.instant('core.Error_connecting_server');
		        });

				// Mis compras
				Restangular.one('users',$scope.authentication.user._id).all('groupbuys').getList().then(function(data) {

						// Add the real URL to the elements
						for (var i=0; i<data.length; i++) {
							data[i].restangularUrl = data[i].getRequestedUrl();

							// Crop the description
							data[i].description = data[i].description.replace(/<[^>]+>/gm, '');
							data[i].description = data[i].description.substring(0, 20) + '...';
						}

						$scope.myGroupbuys = data;

				}, function errorCallback() {
					$scope.error = $translate.instant('core.Error_connecting_server');
				});

				// Mis avisos

				// Mensajes
			}
		};

		// ----------------------

 		/**
		* @ngdoc method
		* @name core.controller:HomeController.$scope.cookiePolicyViewToogle
		* @methodOf core.controller:HomeController
		*
		* @description
		* Toogles visibility on cookie policy.
		*/
		$scope.cookiePolicyViewToogle = function(){
			$scope.cookiePolicyView = !$scope.cookiePolicyView;
		};

		// ----------------------

		/**
		* @ngdoc method
		* @name core.controller:HomeController.$scope.cookiePolicyViewToogle
		* @methodOf core.controller:HomeController
		*
		* @description
		* Hides the cookie policy alert.
		*/
		$scope.cookiePolicyHideToogle = function(){
			$scope.cookiePolicyHide = !$scope.cookiePolicyHide;

		};

		// ----------------------

	}
]);