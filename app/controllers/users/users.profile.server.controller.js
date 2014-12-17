'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors.server.controller.js'),
	mongoose = require('mongoose'),
	passport = require('passport'),
	User = mongoose.model('User');

/**
 * Formatting user details to send
 */
exports.formattingUser = function(req, res, next) {
	var user 	= req.user,
		isAdmin = (user && user.roles && user.roles.indexOf('admin') !== -1),
		isMe    = (user && user._id.equals(res._id) ),
		result  = {};

	if (user && user._id && res && res._id) {
		// Prepare response in JSON+HAL format.
		result = {
			_links: {
				self: {
					href: '/users/' + res._id
				},

				curies: [{
					name: 'nu',
					href: '/api/v1/{rel}',
					templated: true
				}],
				'nu:avatar': {
					small: {
						href: '/users/' + res._id + '/avatar?size=sm'
					},
					medium: {
						href: '/users/' + res._id + '/avatar?size=md'
					},
					big: {
						href: '/users/' + res._id + '/avatar?size=lg'
					}
				},

				'nu:groupbuys': []
			},
			username: res.username,
			name: res.slug,
			_id: res._id,
		};

		if (isAdmin || isMe) {
			result.lastName 	= res.lastName;
			result.firstName 	= res.firstName;
			result.homeAddress	= res.homeAddress;
			result.email 		= res.email;
		}
		if (isAdmin) {
			result.provider = res.provider;
			result.roles 	= res.roles;
		}
	}

	// Send response
	next(result);
};

/**
* Formatting user details to send
*/
exports.formattingUserList = function(req, res, next) {
	var user 	= req.user,
		isAdmin = (user && user.roles && user.roles.indexOf('admin') !== -1);

	// Prepare response in JSON+HAL format.
	var result = {
		_links: {
			self: {
				href: '/users/'
			},
			curies: [{
				name: 'nu',
				href: '/api/v1/{rel}',
				templated: true
			}],
			'nu:user': []
		}
	};

	for (var i = 0; i < res.length; i++) {
		result._links['nu:user'].push({
			href: '/users/' + res[i]._id,
			title: res[i].username,
			name: res[i].slug,
			'nu:avatar': {
				small: {
					href: '/users/' + res[i]._id + '/avatar?size=sm'
				}
			}
		});
	}

	// Send response
	next(result);
};

/**
 * Update user details
 */
exports.update = function(req, res) {
	// Init Variables
	var user = req.user;
	var message = null;

	// For security measurement we remove the roles from the req.body object
	delete req.body.roles;

	if (user) {
		// Merge existing user
		user = _.extend(user, req.body);
		user.updated = Date.now();
		user.displayName = user.firstName + ' ' + user.lastName;

		user.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.json(user);
					}
				});
			}
		});
	} else {
		res.status(400).send({
			message: 'User is not signed in'
		});
	}
};

/**
 * Send User
 */
/*
exports.me = function(req, res) {
	res.json(req.user || null);
};
*/