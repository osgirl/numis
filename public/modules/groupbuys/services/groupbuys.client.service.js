'use strict';

//Groupbuys service used to communicate Groupbuys REST endpoints
angular.module('groupbuys').factory('Groupbuys', ['$resource',
	function($resource) {
		return $resource('api/v1/groupbuys/:groupbuyId', { groupbuyId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);

/*
angular.module('groupbuys').factory('Groupbuys', ['$resource',
function($resource) {
	return $resource('api/v1/groupbuys/:id');
}
]);*/