'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Groupbuy = mongoose.model('Groupbuy'),
	_ = require('lodash');

/**
 * Create a Groupbuy
 */
exports.create = function(req, res) {
	var groupbuy = new Groupbuy(req.body);
	groupbuy.user = req.user;

	groupbuy.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(groupbuy);
		}
	});
};

/**
 * Show the current Groupbuy
 */
exports.read = function(req, res) {
	res.jsonp(req.groupbuy);
};

/**
 * Update a Groupbuy
 */
exports.update = function(req, res) {
	var groupbuy = req.groupbuy ;

	groupbuy = _.extend(groupbuy , req.body);

	groupbuy.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(groupbuy);
		}
	});
};

/**
 * Delete an Groupbuy
 */
exports.delete = function(req, res) {
	var groupbuy = req.groupbuy ;

	groupbuy.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(groupbuy);
		}
	});
};

/**
 * List of Groupbuys
 */
exports.list = function(req, res) {
	Groupbuy.find().sort('-created').populate('user', 'displayName').exec(function(err, groupbuys) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(groupbuys);
		}
	});
};

/**
 * Groupbuy middleware
 */
exports.groupbuyByID = function(req, res, next, id) {
	Groupbuy.findById(id).populate('user', 'displayName').exec(function(err, groupbuy) {
		if (err) return next(err);
		if (! groupbuy) return next(new Error('Failed to load Groupbuy ' + id));
		req.groupbuy = groupbuy ;
		next();
	});
};

exports.groupbuyBySlug = function(req, res, next, slug) {
	Groupbuy.findOne({'slug': slug}).populate('user', 'displayName').exec(function(err, groupbuy) {
		if (err) return next(err);
		if (! groupbuy) return next(new Error('Failed to load Groupbuy by slug ' + slug));
		req.groupbuy = groupbuy ;
		next();
	});
};

/**
 * Groupbuy authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.groupbuy.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
