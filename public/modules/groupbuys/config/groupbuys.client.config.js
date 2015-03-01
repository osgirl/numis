'use strict';

// Configuring the Articles module
angular.module('groupbuys').run(['Menus', '$translate',
	function(Menus, $translate) {
		// Set top bar menu items
		$translate(['groupbuys.My_Groupbuys', 'groupbuys.List_Groupbuys', 'groupbuys.New_Groupbuy']).then(function (translations) {
			Menus.addMenuItem('topbar',  translations['groupbuys.My_Groupbuys'], 'groupbuys/my-list');
			Menus.addMenuItem('topbar',  translations['groupbuys.List_Groupbuys'], 'groupbuys');
			Menus.addMenuItem('topbar',  translations['groupbuys.New_Groupbuy'], 'groupbuys/create');
		});
	}
]);