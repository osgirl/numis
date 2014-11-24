'use strict';

/**
 * @ngdoc service
 * @name module:core.service:Menus
 *
 * @description
 * AngularJS Menus Service
 *
 * In the 0.3.x version, MEAN.JS has introduced a new AngularJS service that helps you manage your application menus.
 */

//Menu service used for managing  menus
angular.module('core').service('Menus', [

	function() {
		// Define a set of default roles
		this.defaultRoles = ['*'];

		// Define the menus object
		this.menus = {};

		// A private function for rendering decision
		var shouldRender = function(user) {
			if (user) {
				if (!!~this.roles.indexOf('*')) {
					return true;
				} else {
					for (var userRoleIndex in user.roles) {
						for (var roleIndex in this.roles) {
							if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
								return true;
							}
						}
					}
				}
			} else {
				return this.isPublic;
			}

			return false;
		};

		// Validate menu existance
		this.validateMenuExistance = function(menuId) {
			if (menuId && menuId.length) {
				if (this.menus[menuId]) {
					return true;
				} else {
					throw new Error('Menu does not exists');
				}
			} else {
				throw new Error('MenuId was not provided');
			}

			return false;
		};

		/**
 		 * @ngdoc method
		 * @name module:core.service:Menus.getMenu
		 * @methodOf module:core.service:Menus
	 	 *
		 * @param {Number} menuId Indicates the menu identifier
		 * @return {Object} A menu object identified by the menuId argument
		 *
		 * @description
		 * Returns The menu object identified by the menuId argument.
		 */
		// Get the menu object by menu id
		this.getMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			return this.menus[menuId];
		};

		/**
		 * @ngdoc method
		 * @name module:core.service:Menus.addMenu
		 * @methodOf module:core.service:Menus
		 *
		 * @param {Number} menuId Indicates the menu identifier for future reference
		 * @param {Boolean} isPublic Indicates whether a menu should be displayed only to authenticated users
		 * @param {Array.<String>} [roles=&#91;'user'&#93;] An array indicating the roles that are allowed to view this menu
		 * @return {Object} The menu object.
		 *
		 * @description
		 * Creates a new menu object, which will be identified by the menuId argument.
		 */
		// Add new menu object by menu id
		this.addMenu = function(menuId, isPublic, roles) {
			// Create the new menu
			this.menus[menuId] = {
				isPublic: isPublic || false,
				roles: roles || this.defaultRoles,
				items: [],
				shouldRender: shouldRender
			};

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenu = function(menuId) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Return the menu object
			delete this.menus[menuId];
		};

		/**
		 * @ngdoc method
		 * @name module:core.service:Menus.addMenuItem
		 * @methodOf module:core.service:Menus
		 *
		 * @param {Number} menuId Indicates the menu identifier.
		 * @param {String} menuItemTitle A String title for the menu item.
		 * @param {String} menuItemURL The path this menu item will link to.
		 * @param {String} [menuItemType='item'] -
		 * @param {String} [menuItemUIRoute=menuItemURL] The UIRoute value, which is used to define the URL scheme where this menu item is marked as active.
		 * @param {Boolean} isPublic Indicates whether a menu item should be displayed only to authenticated users.
		 * @param {Array.<String>} [roles=&#91;'user'&#93;] An array indicating the roles that are allowed to view this menu item.
		 * @param {Number} [position=0] -
		 * @return {Object} The menu object.
		 *
		 * @description
		 * Creates a new menu item object.
		 */
		// Add menu item object
		this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Push new menu item
			this.menus[menuId].items.push({
				title: menuItemTitle,
				link: menuItemURL,
				menuItemType: menuItemType || 'item',
				menuItemClass: menuItemType,
				uiRoute: menuItemUIRoute || ('/' + menuItemURL),
				isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
				roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
				position: position || 0,
				items: [],
				shouldRender: shouldRender
			});

			// Return the menu object
			return this.menus[menuId];
		};

		/**
		 * @ngdoc method
		 * @name module:core.service:Menus.addSubMenuItem
		 * @methodOf module:core.service:Menus
		 *
		 * @param {Number} menuId Indicates the menu identifier.
		 * @param {String} rootMenuItemURL Indicates the root menu item identifier.
		 * @param {String} menuItemTitle A String title for the menu item.
		 * @param {String} menuItemURL The path this menu item will link to.
		 * @param {String} [menuItemUIRoute=menuItemURL] The UIRoute value, which is used to define the URL scheme where this menu item is marked as active.
		 * @param {Boolean} isPublic Indicates whether a menu item should be displayed only to authenticated users.
		 * @param {Array.<String>} [roles=&#91;'user'&#93;] An array indicating the roles that are allowed to view this menu item.
		 * @param {Number} [position=0] -
		 * @return {Object} The menu object.
		 *
		 * @description
		 * Adds a submenu item to an existing item object.
		 */
		// Add submenu item object
		this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
					// Push new submenu item
					this.menus[menuId].items[itemIndex].items.push({
						title: menuItemTitle,
						link: menuItemURL,
						uiRoute: menuItemUIRoute || ('/' + menuItemURL),
						isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
						roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
						position: position || 0,
						shouldRender: shouldRender
					});
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeMenuItem = function(menuId, menuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
					this.menus[menuId].items.splice(itemIndex, 1);
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		// Remove existing menu object by menu id
		this.removeSubMenuItem = function(menuId, submenuItemURL) {
			// Validate that the menu exists
			this.validateMenuExistance(menuId);

			// Search for menu item to remove
			for (var itemIndex in this.menus[menuId].items) {
				for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
					if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
						this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
					}
				}
			}

			// Return the menu object
			return this.menus[menuId];
		};

		//Adding the topbar menu
		this.addMenu('topbar');
	}
]);