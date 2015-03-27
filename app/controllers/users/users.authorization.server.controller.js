'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	errorHandler = require('../errors.server.controller'),
	userProfileHandler = require('./users.profile.server.controller.js'),
	mongoose = require('mongoose'),
	User = mongoose.model('User');


/**
 * Grant specified role to an user
 */
var grantRoles = function(user, roles, callback) {
	var newRoles = _.union(user.roles, roles);

	if (newRoles !== user.roles) {
		user.roles = newRoles;
		user.save(callback);

	} else {
		callback(null, user);
	}
};

/**
 * Remove specified role to an user
 */
var removeRoles = function(user, roles, callback) {
	var newRoles = _.difference(user.roles, roles);

	if (newRoles !== user.roles) {
		user.roles = newRoles;
		user.save(callback);

	} else {
		callback(null, user);
	}
};


/**
 * Approve user account. Grant admin role to an user
 */
exports.approve = function(req, res) {
	grantRoles(req.profile, ['user'], function(err, user) {
		if (err) {
			// Bad Request
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// OK.
			res.jsonp( userProfileHandler.formattingUser(user, req) );
		}
	});
};


/**
 * Suspend user account. Revoke 'user' role from an user
 */
exports.suspend = function(req, res) {
	removeRoles(req.profile, ['admin', 'user', 'request-suspend'], function(err, user) {
		if (err) {
			// Bad Request
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// OK.
			res.jsonp( userProfileHandler.formattingUser(user, req) );
		}
	});
};


/**
 * Suspend user account. Revoke 'user' role from an user
 */
exports.requestSuspend = function(req, res) {
	grantRoles(req.profile, ['request-suspend'], function(err, user) {
		if (err) {
			// Bad Request
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// OK.
			res.jsonp( userProfileHandler.formattingUser(user, req) );
		}
	});
};


/**
 * Grant admin role to an user
 */
exports.grantAdmin = function(req, res) {
	grantRoles(req.profile, ['admin'], function(err, user) {
		if (err) {
			// Bad Request
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// OK.
			res.jsonp( userProfileHandler.formattingUser(user, req) );
		}
	});
};


/**
 * Remove admin role from an user
 */
exports.revokeAdmin = function(req, res) {
	removeRoles(req.profile, ['admin'], function(err, user) {
		if (err) {
			// Bad Request
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// OK.
			res.jsonp( userProfileHandler.formattingUser(user, req) );
		}
	});
};



/**
 * User middleware
 */
exports.userByID = function(req, res, next, id) {
	User.findOne({
		_id: id
	}).exec(function(err, user) {
		if (err) return next(err);
		if (!user) return next(new Error('Failed to load User ' + id));
		req.profile = user;
		next();
	});
};

/**
 * Require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
	if (!req.isAuthenticated()) {
		return res.status(401).send({
			name: 'NotLogged',
			message: 'User is not logged in',
		});
	}

	next();
};

/**
 * User authorizations routing middleware
 */
exports.hasAuthorization = function(roles) {
	var _this = this;

	return function(req, res, next) {
		_this.requiresLogin(req, res, function() {
			if (_.indexOf(roles, 'self') > -1 && req.profile && typeof req.profile !== 'undefined' && req.profile.id === req.user.id) {
				return next();
			} else if (_.intersection(req.user.roles, _.pull(roles, 'self') ).length) {
				return next();
			} else {
				return res.status(403).send({
					name: 'NotAuthorized',
					message: 'User is not authorized'
				});
			}
		});
	};
};