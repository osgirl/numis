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
var formattingUser = exports.formattingUser = function(user, req, callback) {
	var isAdmin = (req.user && typeof req.user.roles !== 'undefined' && req.user.roles.indexOf('admin') !== -1),
		isMe    = (user && user._id.equals(req.user._id) ),
		result  = {};

	//if (user && user._id && me && me._id) {
	if (user && user._id) {
		var selfURL = req.method === 'GET' ? req.url : req.url + '/' + user._id;

		// Prepare response in JSON+HAL format.
		result = {
			_links: {
				self: { href: selfURL },
				avatar: {
					href: selfURL + '/avatar{?size}',
					title: 'Avatar image',
					templated: true
				},

				groupbuys: []
			},
			_id: 	  user._id,
			username: user.username,
			name: 	  user.name
		};

		if (user.provider === 'local') {
			result._links.password = { href: '/api/v1/users/password', title: 'Change own password'};
		}

		if (isAdmin || isMe) {
			result.lastName 	= user.lastName;
			result.firstName 	= user.firstName;
			result.homeAddress	= user.homeAddress;
			result.email 		= user.email;
		}
		if (isAdmin) {
			result.provider = user.provider;
			result.roles 	= user.roles;
		}
	}

	if (typeof callback !== 'undefined') {
		callback(result);
	} else {
		return result;
	}
};

/**
* Formatting user details to send
*/
var formattingUserList = exports.formattingUserList = function(users, req, callback) {
	var isAdmin = (req.user && typeof req.user.roles !== 'undefined' && req.user.roles.indexOf('admin') !== -1),
		result  = {};

	// Prepare response in JSON+HAL format.
	result = {
		_links: {
			self: { href: req.url }
		},
		_embedded: {
			users: []
		}
	};

	for (var i = 0; i < users.length; i++) {
		result._embedded.users.push({
			_links: {
				self: {href: req.url + '/' + users[i]._id},
				avatar: {
					href: req.url + '/' + users[i]._id + '/avatar{?size}',
					title: 'Avatar image',
					templated: true
				}
			},
			_id:      users[i]._id,
			username: users[i].username,
			name: 	  users[i].name
		});
	}

	if (typeof callback !== 'undefined') {
		callback(result);
	} else {
		return result;
	}
};


/**
 * Create a User
 */
exports.create = function(req, res) {
	var user = new User(req.body);

	user.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(201).jsonp( formattingUser(user, req) );
		}
	});
};

/**
 * Show the current User
 */
exports.read = function(req, res) {
	res.jsonp( formattingUser(req.user, req) );
};

/**
 * Update user details
 */
exports.update = function(req, res) {
	// Init Variables
	var user = req.user;

	// For security measurement we remove the roles from the req.body object
	delete req.body.roles;

	if (user) {
    	// Merge existing user
        user = _.extend(user, req.body);
        user.updated = Date.now();
        user.displayName = user.firstName + ' ' + user.lastName;

        user.save(function(err) {
        	if (err) {
				// Bad Request
        		return res.status(400).send( errorHandler.prepareErrorResponse (err) );
        	} else {
        		req.login(user, function(err) {
        			if (err) {
						// Bad Request
						res.status(400).send( errorHandler.prepareErrorResponse (err) );
        			} else {
						// OK. No Content
						res.status(204).end();
        			}
        		});
			}
		});
	} else {
		res.status(401).send({
			name: 'NotLogged',
			message: 'User is not logged in',
		});
	}
};

/**
 * Delete an User
 */
exports.delete = function(req, res) {
	var user = req.user;

	user.remove(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * List of Users
 */
exports.list = function(req, res) {
	User.find().select('_id username name provider roles').sort('username').exec(function(err, users) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingUserList(users, req) );
		}
	});
};


/*
 * Send User
 */
exports.me = function(req, res) {
	var fakeReq = {
		url: req.url.replace(/me$/, req.user.id),
		method: 'GET'
	};

	res.jsonp( formattingUser(req.user, fakeReq) );
};
