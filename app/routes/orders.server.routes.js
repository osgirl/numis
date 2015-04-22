'use strict';

module.exports = function(app) {
	var core      = require('../../app/controllers/core.server.controller'),
		users     = require('../../app/controllers/users.server.controller'),
		groupbuys = require('../../app/controllers/groupbuys.server.controller'),
		orders    = require('../../app/controllers/orders.server.controller');


	// Get all orders (only admins)
	app.route('/api/v1/orders')
		.get(users.requiresLogin, users.hasAuthorization(['admin']), core.prepareQueryParams, orders.list);

	// Get an order details, update an existing order (managers) or delete an order (only admins)
	app.route('/api/v1/orders/:orderId')
		.get(users.requiresLogin, groupbuys.hasVisibility('itemsByMember'), orders.read)
		.put(users.requiresLogin, groupbuys.hasAuthorization(['manager']), orders.update)
		.delete(users.requiresLogin, users.hasAuthorization(['admin']), orders.delete);

	// Add a request to an existing order
	app.route('/api/v1/orders/:orderId/add-request')
		.post(users.requiresLogin, groupbuys.hasAuthorization(['member']), orders.addRequestBySummary);

	// Remove a request from an order
	app.route('/api/v1/orders/:orderId/remove-request')
		.post(users.requiresLogin, users.hasAuthorization(['admin']), orders.removeRequest);

	// Force to calculate summary, subtotal and total fields.
	app.route('/api/v1/orders/:orderId/calculate')
		.post(users.requiresLogin, groupbuys.hasAuthorization(['manager']), orders.calculateSummary);

	// Get all orders belong to an user
	app.route('/api/v1/users/:userId/orders')
		.get(users.requiresLogin, users.hasAuthorization(['self','admin']), core.prepareQueryParams, orders.list);

	// Get all orders belong to a groupbuy and create new order to a groupbuy
	app.route('/api/v1/groupbuys/:groupbuyId/orders')
		.get(users.requiresLogin, groupbuys.hasVisibility('itemsByMember'), core.prepareQueryParams, orders.list)
		.post(users.requiresLogin, groupbuys.hasAuthorization(['member']), orders.create);

	// Get the order from an user in a groupbuy (list)
	app.route('/api/v1/groupbuys/:groupbuyId/users/:userId/orders')
		.get(users.requiresLogin, groupbuys.hasVisibility('itemsByMember'), core.prepareQueryParams, orders.list);

	// Finish by binding the middlewares
	app.param('orderId', orders.orderByID);
	app.param('userId', users.userByID);
	app.param('groupbuyId', groupbuys.groupbuyByID);
};
