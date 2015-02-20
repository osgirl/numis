'use strict';

module.exports = function(app) {
	var users     = require('../../app/controllers/users.server.controller'),
		groupbuys = require('../../app/controllers/groupbuys.server.controller');

	// Groupbuys Routes
	app.route('/api/v1/groupbuys')
		.get(users.requiresLogin, groupbuys.list)
		.post(users.requiresLogin, groupbuys.create);

	app.route('/api/v1/groupbuys/:groupbuyId')
		.get(users.requiresLogin, groupbuys.read)
		.put(users.requiresLogin, groupbuys.hasAuthorization(['manager']), groupbuys.update)
		.delete(users.requiresLogin, users.hasAuthorization(['admin']), groupbuys.delete);

	// Groupbuy Members Routes
	app.route('/api/v1/groupbuys/:groupbuyId/members')
		.get(users.requiresLogin, groupbuys.hasVisibility('members'), groupbuys.getMembersList)
		.put(users.requiresLogin, groupbuys.addMember);

	app.route('/api/v1/groupbuys/:groupbuyId/members/:userId')
		.delete(users.requiresLogin, groupbuys.hasAuthorization(['manager']), groupbuys.deleteMember);

	// Groupbuy Managers Routes
	app.route('/api/v1/groupbuys/:groupbuyId/managers')
		.get(users.requiresLogin, groupbuys.hasVisibility('managers'), groupbuys.getManagersList)
		.put(users.requiresLogin, groupbuys.hasAuthorization(['manager']), groupbuys.addManager);

	app.route('/api/v1/groupbuys/:groupbuyId/managers/:userId')
		.delete(users.requiresLogin, groupbuys.hasAuthorization(['manager']), groupbuys.deleteManager);


	// List Groupbuys form specified user
	app.route('/api/v1/users/:userId/groupbuys')
		.get(users.requiresLogin, users.hasAuthorization(['self','admin']), groupbuys.list);


	// Finish by binding the Item middleware
	app.param('userId', users.userByID);
	app.param('groupbuyId', groupbuys.groupbuyByID);

};
