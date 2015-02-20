'use strict';

module.exports = function(app) {
	var users     = require('../../app/controllers/users.server.controller'),
		groupbuys = require('../../app/controllers/groupbuys.server.controller'),
		orders    = require('../../app/controllers/orders.server.controller');


	// Orders Routes
	app.route('/api/v1/orders')
		.get(users.requiresLogin, users.hasAuthorization(['admin']), orders.list)
		.post(users.requiresLogin, orders.create);

	app.route('/api/v1/orders/:orderId')
		.get(users.requiresLogin, orders.read)
		.put(users.requiresLogin, groupbuys.hasAuthorization(['manager']), orders.update)
		.delete(users.requiresLogin, users.hasAuthorization(['admin']), orders.delete);

	app.route('/api/v1/orders/:orderId/add-request')
		.post(users.requiresLogin, groupbuys.hasAuthorization(['manager','member']), orders.addRequest);

	app.route('/api/v1/orders/:orderId/remove-request')
		.post(users.requiresLogin, users.hasAuthorization(['admin']), orders.removeRequest);

	app.route('/api/v1/orders/:orderId/calculate')
		.post(users.requiresLogin, groupbuys.hasAuthorization(['manager']), orders.calculateSummary);

	app.route('/api/v1/users/:userId/orders')
		.get(users.requiresLogin, users.hasAuthorization(['self','admin']), orders.list);

	app.route('/api/v1/groupbuys/:groupbuyId/orders')
		.get(users.requiresLogin, groupbuys.hasVisibility('itemsByMember'), orders.list);


	// Finish by binding the middlewares
	app.param('orderId', orders.orderByID);
	app.param('userId', users.userByID);
	app.param('groupbuyId', groupbuys.groupbuyByID);
};
