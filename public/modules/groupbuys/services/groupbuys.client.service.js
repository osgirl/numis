'use strict';

//Groupbuys service used to communicate Groupbuys REST endpoints
angular.module('groupbuys').factory('Groupbuys', ['$resource',
	function($resource) {
		return $resource('groupbuys/:groupbuyId', { groupbuyId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);