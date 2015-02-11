'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller'),
		groupbuys = require('../../app/controllers/groupbuys.server.controller'),
		orders = require('../../app/controllers/orders.server.controller');

	// Orders Routes
	app.route('/orders')
		.get(orders.list)
		.post(users.requiresLogin, orders.create);

	app.route('/orders/:orderId')
		.get(orders.read)
		.put(users.requiresLogin, orders.hasAuthorization, orders.update)
		.delete(users.requiresLogin, orders.hasAuthorization, orders.delete);

	app.route('/users/:userId/orders/')
		.get(orders.list);

	app.route('/groupbuys/:groupbuyId/orders/')
		.get(orders.list);

	// Finish by binding the middlewares
	app.param('orderId', orders.orderByID);
	app.param('userId', users.userByID);
	app.param('groupbuyId', groupbuys.groupbuyByID);
};
