'use strict';

/**
 * @ngdoc service
 * @name users.service:Users
 *
 * @requires $resource
 *
 * @description Provides a RESTful service for Users
 */

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource',
	function($resource) {
		return $resource('users', {}, {
			/**
			 * @ngdoc method
			 * @name users.service:Users.update
			 * @methodOf users.service:Users
			 */
			update: {
				method: 'PUT'
			}
		});
	}
]);