'use strict';

//Setting up route
angular.module('groupbuys').config(['$stateProvider',
	function($stateProvider) {
		// Groupbuys state routing
		$stateProvider.
			state('listGroupbuys', {
				url: '/groupbuys',
				templateUrl: 'modules/groupbuys/views/list-groupbuys.client.view.html'
			}).
			state('createGroupbuy', {
				url: '/groupbuys/create',
				templateUrl: 'modules/groupbuys/views/create-groupbuy.client.view.html'
			}).
			state('viewGroupbuy', {
				url: '/groupbuys/:groupbuySlug',
				templateUrl: 'modules/groupbuys/views/view-groupbuy.client.view.html'
			}).
			state('editGroupbuy', {
				url: '/groupbuys/:groupbuySlug/edit',
				templateUrl: 'modules/groupbuys/views/edit-groupbuy.client.view.html'
			});
	}
]);