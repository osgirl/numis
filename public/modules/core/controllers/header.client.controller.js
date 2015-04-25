'use strict';

/**
 * @ngdoc controller
 * @name core.controller:HeaderController
 *
 * @requires $cope
 * @requires module:users.service:Authentication
 * @requires core.service:Menus
 *
 * @description
 * Header controller
 */

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus',
	function($scope, Authentication, Menus) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;

		// TODO Filter roles for admin link
		//if (typeof $scope.authentication.user.roles !== 'undefined' && $scope.authentication.user.roles.indexOf('admin') !== -1 ) {
		//	Menus.addMenuItem('topbar',  'Administrar a fuego', 'groupbuys/create');
		//}
		Menus.addMenuItem('topbar',  'Administrar a fuego', 'admin');


		$scope.menu = Menus.getMenu('topbar');


		/**
		* @ngdoc method
		* @name core.controller:HeaderController.$scope·toggleCollapsibleMenu
		* @methodOf core.controller:HeaderController
		*/
		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);