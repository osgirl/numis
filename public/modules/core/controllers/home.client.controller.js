'use strict';

/**
 * @ngdoc controller
 * @name module:core.controller:HomeController
 *
 * @requires $cope
 * @requires users.service:Authentication
 *
 * @description
 * Home page controller
 */

angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function($scope, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;
	}
]);