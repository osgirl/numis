'use strict';

/**
 * @ngdoc service
 * @name module:users.service:Users
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
			 * @name module:users.service:Users.update
			 * @methodOf module:users.service:Users
			 */
			update: {
				method: 'PUT'
			}
		});
	}
]);