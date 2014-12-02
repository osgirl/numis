'use strict';

// Configuring the Articles module
angular.module('groupbuys').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Groupbuys', 'groupbuys', 'dropdown', '/groupbuys(/create)?');
		Menus.addSubMenuItem('topbar', 'groupbuys', 'List Groupbuys', 'groupbuys');
		Menus.addSubMenuItem('topbar', 'groupbuys', 'New Groupbuy', 'groupbuys/create');
	}
]);