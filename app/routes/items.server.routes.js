'use strict';

module.exports = function(app) {
	var core      = require('../../app/controllers/core.server.controller'),
		users     = require('../../app/controllers/users.server.controller'),
		groupbuys = require('../../app/controllers/groupbuys.server.controller'),
		items     = require('../../app/controllers/items.server.controller');

	// Items Routes
	app.route('/api/v1/groupbuys/:groupbuyId/items')
		.get(users.requiresLogin, groupbuys.hasVisibility('items'), core.prepareQueryParams, items.list)
		.post(users.requiresLogin, items.create);

	app.route('/api/v1/groupbuys/:groupbuyId/items/:itemId')
		.get(users.requiresLogin, groupbuys.hasVisibility('items'), items.read)
		.put(users.requiresLogin, items.hasAuthorization, items.update)
		.delete(users.requiresLogin, items.hasAuthorization, items.delete);

	// End-points routes to manage image of the items.
	app.route('/api/v1/groupbuys/:groupbuyId/items/:itemId/image')
		.get(users.requiresLogin, groupbuys.hasVisibility('items'), items.getImage)
		.put(users.requiresLogin, items.hasAuthorization, items.updateImage)
		.delete(users.requiresLogin, items.hasAuthorization, items.deleteImage);

	// Finish by binding the Item middleware
	app.param('itemId', items.itemByID);
	app.param('groupbuyId', groupbuys.groupbuyByID);
};