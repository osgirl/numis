'use strict';

module.exports = function(app) {
	// Root routing
	var core = require('../../app/controllers/core.server.controller');
	app.route('/').get(core.index);

	// ReST API Root EndPoint
	app.route('/api/v:version/').get(core.getApiRootPoint);

	// Finish by binding the Item middleware
	app.param('version', core.versionByNumber);
};