'use strict';

/**
 * @ngdoc controller
 * @name groupbuys.controller:GroupbuysController
 *
 * @requires $cope
 * @requires $stateParams
 * @requires $location
 * @requires $translate
 * @requires users.service:Authentication
 * @requires users.service:Groupbuys
 *
 * @description
 * Controlador encargado de la gestión de las Compras en Grupo.
 */

// Groupbuys controller
angular.module('groupbuys').controller('GroupbuysController', ['$scope', '$stateParams', '$location', '$translate', 'Authentication', 'Groupbuys',
	function($scope, $stateParams, $location, $translate, Authentication, Groupbuys) {
		$scope.authentication = Authentication;
		//$locationProvider.html5Mode(true); // Mode HTML5

		// Configuration of tinyMCE
		$scope.tinymceOptions = {
			resize: false,
			menubar: false,
			statusbar: false,
			plugins: 'textcolor image table',
			toolbar1: 'bold italic underline strikethrough | forecolor backcolor fontsizeselect | removeformat',
			toolbar2: 'alignleft aligncenter alignright | bullist numlist outdent indent | table image'
		};



		/**
		* @ngdoc method
		* @name groupbuys.controller:GroupbuysController.$scope·create
		* @methodOf groupbuys.controller:GroupbuysController
		*
		* @description
		* Create new Groupbuy
		*/
		$scope.create = function(isValid) {
			if (isValid) {
				$scope.success = $scope.error = null;
				// Create new Groupbuy object
				var groupbuy = new Groupbuys ($scope.groupbuy);

				// Add creation user to the groupbuy
				if ($scope.authentication && $scope.authentication.user) {
					groupbuy.managers = [];
					groupbuy.managers.push($scope.authentication.user._id);

					// TODO: Make this a list
					groupbuy.members = $scope.authentication.user._id;
				} else {
					return null;
				}

				// Redirect after save
				groupbuy.$save(function(response) {
					$scope.success = true;
					$location.path('groupbuys/' + response.slug + '/manage');

					// Clear form fields
					$scope.name = '';
					$scope.description = '';
				}, function(errorResponse) {
					$scope.error = errorResponse.data.message;
				});
			} else {
				$scope.submitted = true;
			}
		};

		/**
		* @ngdoc method
		* @name groupbuys.controller:GroupbuysController.$scope·remove
		* @methodOf groupbuys.controller:GroupbuysController
		*
		* @description
		* Remove existing Groupbuy
		*/
		$scope.remove = function(groupbuy) {
			if ( groupbuy ) {
				groupbuy.$remove();

				for (var i in $scope.groupbuys) {
					if ($scope.groupbuys [i] === groupbuy) {
						$scope.groupbuys.splice(i, 1);
					}
				}
			} else {
				$scope.groupbuy.$remove(function() {
					$location.path('groupbuys');
				});
			}
		};

		/**
		* @ngdoc method
		* @name groupbuys.controller:GroupbuysController.$scope·create
		* @methodOf groupbuys.controller:GroupbuysController
		*
		* @description
		* Update existing Groupbuy
		*/
		$scope.update = function() {
			var groupbuy = $scope.groupbuy;

			groupbuy.$update(function() {
				$location.path('groupbuys/' + groupbuy.slug +'/manage');
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Groupbuys
		$scope.find = function() {
			$scope.groupbuys = Groupbuys.query();
		};


		/**
		* @ngdoc method
		* @name groupbuys.controller:GroupbuysController.$scope·findOne
		* @methodOf groupbuys.controller:GroupbuysController
		*
		* @description
		* Loads the groupbuy, userRole and tabs in the scope.
		*/
		$scope.findOne = function() {
			$scope.groupbuy = Groupbuys.get({
				groupbuySlug: $stateParams.groupbuySlug
			});

			$scope.groupbuy.$promise.then(function() {
				$scope.userRole = $scope.userRole();
				$scope.loadTabs();
			});
		};


		/**
		* @ngdoc method
		* @name groupbuys.controller:GroupbuysController.$scope·userRole
		* @methodOf groupbuys.controller:GroupbuysController
		*
		* @description
		* Return the role ('manager', 'member', 'none') of the user in the groupbuy according to the url provided.
		*/
		$scope.userRole = function() {
			var role = 'none';
			var manage = false;

			if ($scope.authentication && $scope.authentication.user) {
				var userId  = $scope.authentication.user._id,
				fullUrl = $location.path().split('/');

				if (fullUrl[fullUrl.length - 1] === 'manage') {
					manage = true;
				}

				if ( $scope.groupbuy.members.length > 0 && $scope.groupbuy.members.indexOf(userId) !== -1 ) {
					role = 'member';
				}

				if ( manage && $scope.groupbuy.managers.length > 0 && $scope.groupbuy.managers.indexOf(userId) !== -1 ) {
					role = 'manager';
				}

				return role;
			} else {
				return null;
			}
		};


		/**
		* @ngdoc method
		* @name groupbuys.controller:GroupbuysController.$scope·loadTabs
		* @methodOf groupbuys.controller:GroupbuysController
		*
		* @description
		* Loads the proper tabs in the scope based on the role of the user
		*/
		$scope.loadTabs =  function() {
			// Create the tabs menu according to the permissions of the user:
			$translate([
				'groupbuys.Information',
				'groupbuys.Items',
				'groupbuys.Buyers',
				'groupbuys.Requests',
				'groupbuys.Requests_summary',
				'groupbuys.Messaging',
				'groupbuys.Payments',
				'groupbuys.Deliveries',
				'groupbuys.Managers',
				'groupbuys.Configuration'
				]).then(function (translations) {
					switch ( $scope.userRole ){
						case 'manager':
							$scope.tabs = [
						{
							title: translations['groupbuys.Information'],
							template: '/modules/groupbuys/views/tabs/info-groupbuy.client.view.html',
							active: true
						},{
							title: translations['groupbuys.Items'],
							template:'/modules/groupbuys/views/tabs/items-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Buyers'],
							template:'/modules/groupbuys/views/tabs/buyers-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Requests'],
							template:'/modules/groupbuys/views/tabs/requests-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Requests_summary'],
							template:'/modules/groupbuys/views/tabs/requests-summary-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Messaging'],
							template:'/modules/groupbuys/views/tabs/messaging-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Payments'],
							template:'/modules/groupbuys/views/tabs/payments-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Deliveries'],
							template:'/modules/groupbuys/views/tabs/deliveries-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Managers'],
							template:'/modules/groupbuys/views/tabs/managers-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Configuration'],
							template:'/modules/groupbuys/views/tabs/config-groupbuy.client.view.html'
						}
						];
						break;
						case 'member':
							$scope.tabs = [
						{
							title: translations['groupbuys.Information'],
							template: '/modules/groupbuys/views/tabs/info-groupbuy.client.view.html',
							active: true
						},{
							title: translations['groupbuys.Items'],
							template:'/modules/groupbuys/views/tabs/items-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Buyers'],
							template:'/modules/groupbuys/views/tabs/buyers-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Messaging'],
							template:'/modules/groupbuys/views/tabs/messaging-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Payments'],
							template:'/modules/groupbuys/views/tabs/payments-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Deliveries'],
							template:'/modules/groupbuys/views/tabs/deliveries-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Managers'],
							template:'/modules/groupbuys/views/tabs/managers-groupbuy.client.view.html'
						}
						];
						break;
						default:
							$scope.tabs = [
						{
							title: translations['groupbuys.Information'],
							template: '/modules/groupbuys/views/tabs/info-groupbuy.client.view.html',
							active: true
						},{
							title: translations['groupbuys.Items'],
							template:'/modules/groupbuys/views/tabs/items-groupbuy.client.view.html'
						},{
							title: translations['groupbuys.Managers'],
							template:'/modules/groupbuys/views/tabs/managers-groupbuy.client.view.html'
						}
						];
						break;
					}
				});
			};


			
// from the top of the file
	}
]);
