'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var currencies = require('../../app/controllers/currencies.server.controller');

	// Currencies Routes
	app.route('/api/v1/currencies')
		.get(users.requiresLogin, currencies.list);

	app.route('/api/v1/currencies/default')
		.get(users.requiresLogin, currencies.getDefault);

	app.route('/api/v1/currencies/:currencyId')
		.get(users.requiresLogin, currencies.read);

	// Finish by binding the Currency middleware
	app.param('currencyId', currencies.currencyByID);
};
