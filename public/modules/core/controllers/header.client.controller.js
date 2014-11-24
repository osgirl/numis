'use strict';

/**
 * @ngdoc controller
 * @name module:core.controller:HeaderController
 *
 * @requires $cope
 * @requires module:users.service:Authentication
 * @requires module:core.service:Menus
 *
 * @description
 * Header controller
 */

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus',
	function($scope, Authentication, Menus) {
		$scope.authentication = Authentication;
		$scope.isCollapsed = false;
		$scope.menu = Menus.getMenu('topbar');

		$scope.toggleCollapsibleMenu = function() {
			$scope.isCollapsed = !$scope.isCollapsed;
		};

		// Collapsing the menu after navigation
		$scope.$on('$stateChangeSuccess', function() {
			$scope.isCollapsed = false;
		});
	}
]);