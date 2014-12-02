'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var groupbuys = require('../../app/controllers/groupbuys.server.controller');

	// Groupbuys Routes
	app.route('/groupbuys')
		.get(groupbuys.list)
		.post(users.requiresLogin, groupbuys.create);

	app.route('/groupbuys/:groupbuySlug')
		.get(groupbuys.read)
		.put(users.requiresLogin, groupbuys.hasAuthorization, groupbuys.update)
		.delete(users.requiresLogin, groupbuys.hasAuthorization, groupbuys.delete);

	// Finish by binding the Groupbuy middleware
	app.param('groupbuyId', groupbuys.groupbuyByID);
	app.param('groupbuySlug', groupbuys.groupbuyBySlug);
};
