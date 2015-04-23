'use strict';

module.exports = function(app) {
	var users     = require('../../app/controllers/users.server.controller'),
		groupbuys = require('../../app/controllers/groupbuys.server.controller'),
		messages  = require('../../app/controllers/messages.server.controller');

	// Messagings Routes
	app.route('/api/v1/groupbuys/:groupbuyId/messages')
		.get(users.requiresLogin, groupbuys.hasAuthorization(['member']), messages.list)
		.post(users.requiresLogin, groupbuys.hasAuthorization(['member']), messages.create);

	app.route('/api/v1/groupbuys/:groupbuyId/member/:userId/messages')
		.get(users.requiresLogin, groupbuys.hasAuthorization(['manager']), messages.list);

	app.route('/api/v1/groupbuys/:groupbuyId/messages/mark-as-read')
		.post(users.requiresLogin, groupbuys.hasAuthorization(['member']), messages.markAsRead);

	app.route('/api/v1/groupbuys/:groupbuyId/messages/:messageId')
		.delete(users.requiresLogin, users.hasAuthorization(['admin']), messages.delete);

	// Finish by binding the Messaging middleware
	app.param('messageId',  messages.messageByID);
	app.param('userId',     users.userByID);
	app.param('groupbuyId', groupbuys.groupbuyByID);
};
