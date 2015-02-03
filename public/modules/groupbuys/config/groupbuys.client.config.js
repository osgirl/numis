'use strict';

// Configuring the Articles module
angular.module('groupbuys').run(['Menus', '$translate',
	function(Menus, $translate) {
		// Set top bar menu items
		$translate(['groupbuys.Groupbuys', 'groupbuys.List_Groupbuys', 'groupbuys.New_Groupbuy']).then(function (translations) {
			Menus.addMenuItem('topbar', translations['groupbuys.Groupbuys'], 'groupbuys', 'dropdown', 'api/v1/groupbuys(/create)?');
			Menus.addSubMenuItem('topbar', 'groupbuys', translations['groupbuys.List_Groupbuys'], 'api/v1/groupbuys');
			Menus.addSubMenuItem('topbar', 'groupbuys', translations['groupbuys.New_Groupbuy'], 'api/v1/groupbuys/create');
		});
	}
]);