'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Groupbuy = mongoose.model('Groupbuy'),
	_ = require('lodash');


var checkVisibility = function(groupbuy, property, isAdmin, isMember, isManager) {
	if (isAdmin)
		return true;

		return (groupbuy.visibility[property] === 'public' || 
		groupbuy.visibility[property] === 'restricted' && isMember || 
		groupbuy.visibility[property] === 'private' && isManager);
	};

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

/**
 * Groupbuy authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.groupbuy.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};


/**
* Formatting groupbuy details to send
*/
exports.formattingGroupbuy = function(req, res, next) {
	var user 	  	 = req.user,
		groupbuy	 = res,
		isAdmin   	 = (user && user.roles && user.roles.indexOf('admin') !== -1),
		isMember  	 = (isAdmin || groupbuy.members.indexOf(user._id) !== -1),
		isManager 	 = (isAdmin || groupbuy.managers.indexOf(user._id) !== -1),
		showUpdates  = isMember,
		showVisibilityInfo = isManager,
		showMembers  = checkVisibility(groupbuy, 'members', isAdmin, isMember, isManager),
		showManagers = checkVisibility(groupbuy, 'managers', isAdmin, isMember, isManager),
		showItems 	 = checkVisibility(groupbuy, 'items', isAdmin, isMember, isManager),
		result 	  	 = {};

/* visibility TODO
		shipmentsState: 'restricted',
		paymentStatus: 'restricted',
		itemsByMember: 'restricted',
		itemNumbers: 'public',
*/

	if (user && user._id && groupbuy && groupbuy._id) {
		// Prepare response in JSON+HAL format.
		result = {
			_links: {
				self: {
					href: '/groupbuys/' + groupbuy._id
				},

				curies: [{
					name: 'nu',
					href: '/api/v1/{rel}',
					templated: true
				}]
			},
			title: groupbuy.name,
			status: groupbuy.status,
			description: groupbuy.description,
			name: groupbuy.slug,
			_id: groupbuy._id
		};

		if (showUpdates) {
			result.updates = groupbuy.updates;
		}

		if (showVisibilityInfo) {
			result.visibility = groupbuy.visibility;
		}

		if (showMembers) {
			result._links['nu:members'] = {
				href: '/groupbuys/' + groupbuy._id + '/members',
				title: 'Groupbuy members'
			};

		}

		if (showManagers) {
			result._links['nu:managers'] = {
				href: '/groupbuys/' + groupbuy._id + '/managers',
				title: 'Groupbuy managers'
			};

		}

		if (showItems) {
			result._links['nu:items'] = {
				href: '/groupbuys/' + groupbuy._id + '/items',
				title: 'Groupbuy items'
			};

		}
	}

	// Send response
	next(result);
};

/**
* Formatting groupbuy details to send
*/
exports.formattingGroupbuyList = function(req, res, next) {
	var user 	= req.user,
		isAdmin = (user && user.roles && user.roles.indexOf('admin') !== -1);

	// Prepare response in JSON+HAL format.
	var result = {
		_links: {
			self: {
				href: '/groupbuys/'
			},
			curies: [{
				name: 'nu',
				href: '/api/v1/{rel}',
				templated: true
			}],
			'nu:groupbuy': []
		}
	};

	for (var i = 0; i < res.length; i++) {
		result._links['nu:groupbuy'].push({
			href: '/groupbuy/' + res[i]._id,
			title: res[i].name,
			name: res[i].slug,
			status: res[i].status,
			description: res[i].description
		});
	}

	// Send response
	next(result);
};