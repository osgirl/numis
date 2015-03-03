'use strict';

/**
 * Module dependencies.
 */
var _ 			 = require('lodash'),
	errorHandler = require('../errors.server.controller.js'),
	mongoose     = require('mongoose'),
	path         = require('path'),
	User 		 = mongoose.model('User');

/**
 * Get user avatar
 */
exports.getAvatar = function(req, res) {
	// Init Variables
	var user = req.profile,
		size = req.query.size,
		supportedSizes = ['sm', 'md', 'bg'],
		fileExt,
		fileName;

	if (supportedSizes.indexOf(size) === -1) {
		size = 'md';
	}

	if (user && user.avatar && user.avatar.path) {
		var options = {
			dotfiles: 'deny',
			lastModified: user.avatar.lastModified || false,
			headers: {
				'x-timestamp': Date.now(),
				'x-sent': true
			}
		};

		fileExt  = path.extname(user.avatar.path);
		fileName = path.dirname(user.avatar.path) + path.sep + path.basename(user.avatar.path, fileExt);

		res.sendFile(fileName + '-' + size + fileExt, options, function (err) {
			if (err) {
				res.status(err.status).end();
			}
		});
	} else {
		res.status(404).end();
	}
};

/**
 * Update user avatar
 */
exports.updateAvatar = function(req, res, next) {
	// Init Variables
	var user = req.profile;

	if (!user) {
		res.status(400).send({
			message: 'User is not signed in'
		});
	} else if (!req.files || !req.files.file) {
		res.status(400).send({
			message: 'Has not received any picture'
		});

	} else {
		var file = req.files.file;

		// Generating necesary image attributes.
		file.type = file.mimetype;
		file.lastModifiedDate = Date.now();

		// Updating the user model
		user.set('avatar.file', file);
		user.updated = Date.now();

		// Saving it...
		user.update({ $set: {avatar: user.avatar, upated: user.updated}}, {}, function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.status(204).end();
					}
				});
			}
		});
	}

};

/**
* Delete user avatar
*/
exports.deleteAvatar = function(req, res) {
	// Init Variables
	var user = req.user;

	if (user) {
		user.avatar = {};
		user.avatar.lastModified = Date.now();
		user.updated = Date.now();

		// Saving it...
		user.update({ $set: {avatar: user.avatar, upated: user.updated}}, {}, function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				req.login(user, function(err) {
					if (err) {
						res.status(400).send(err);
					} else {
						res.status(204).end();
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
