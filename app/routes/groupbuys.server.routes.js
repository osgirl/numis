'use strict';

var mongoose = require('mongoose'),
	restEndpoints = require('mongoose-rest-endpoints'),
	users = require('../../app/controllers/users.server.controller');

module.exports = function(app) {

// TODO: Comment it!
//	mongooseRestEndpoints.log.verbose(true);

	// Register end point for '/users' and /users/:id'
	new restEndpoints
				.endpoint('/api/v1/groupbuys', 'Groupbuy', {
					limitFields: ['_id', 'name', 'description', 'slug', 'status', 'managers', 'members'],
					populate: ['members', 'managers', 'user'],
					queryParams: ['$in_status', 'name', '$gte_created'],
					pagination: {
						perPage: 20,
						sortField: 'name'

					}
				})
				.addMiddleware('*', users.requiresLogin)
				.tap('pre_filter', 'list', function(req, data, next) {
					var isAdmin = (req.user && req.user.roles && req.user.roles.indexOf('admin') !== -1);

					if (!isAdmin) {
						if (req.user) {
	//									data.$or = [{_id: '547e3ab9b1a7a0ad7df3fcac'}, {name: 'Japón-500 yenes - Serie prefecturas (Septiembre 2014)'}];
							data.$or = [{status: { '$in': ['new', 'published', 'payments', 'paid', 'shipments', 'closed']} },
										{managers: {$elemMatch: {managers: req.user._id} } }];
						} else {
							data.status = { '$in': ['new', 'published', 'payments', 'paid', 'shipments', 'closed']};
						}

					}
					return next(data);
				})

				.tap('pre_response', 'list', function(req, data, next) {
					var isAdmin = (req.user && req.user.roles && req.user.roles.indexOf('admin') !== -1),
						isManager = false,
						isMember = false;

					return next(data);
				})
				.tap('pre_response', 'fetch', function(req, data, next) {
					var isAdmin = (req.user && req.user.roles && req.user.roles.indexOf('admin') !== -1),
						isManager = false,
						isMember = false;

					return next(data);
				})

				.register(app);

};
