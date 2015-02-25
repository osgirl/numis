'use strict';

/**
 * Module dependencies.
 */
var mongoose 	 = require('mongoose'),
	core         = require('./core.server.controller'),
	errorHandler = require('./errors.server.controller'),
	users 		 = require('./users.server.controller'),
	_ 			 = require('lodash'),
	User 		 = mongoose.model('User'),
	Groupbuy 	 = mongoose.model('Groupbuy');



/**
 * Formatting groupbuy details to send
 */
var formattingGroupbuy = exports.formattingGroupbuy = function(groupbuy, req, reduce) {
	reduce = reduce || false;

	var user 	  	 = req.user,
		isAdmin   	 = user.isAdmin(),
		isMember  	 = (isAdmin || groupbuy.isMember(user._id) ),
		isManager 	 = (isAdmin || groupbuy.isManager(user._id) ),
		showUpdates  = !reduce && isMember,
		showVisibilityInfo = !reduce && isManager,
		showMembers  = !reduce && groupbuy.checkVisibility(user, 'members'),
		showManagers = !reduce && groupbuy.checkVisibility(user, 'managers'),
		showItems 	 = !reduce && groupbuy.checkVisibility(user, 'items'),
		result 	  	 = {},
		i;

	/* visibility TODO
			shipmentsState: 'restricted',
			paymentStatus: 'restricted',
			itemsByMember: 'restricted',
			itemNumbers: 'public',
	*/

	if (user && user._id && groupbuy && groupbuy._id) {
		var selfURL = '/api/v1' + groupbuy.toLink(),
			parentURL = selfURL.replace(/\/[a-f\d]{24}$/i, '');

		// Prepare response in JSON+HAL format.
		result = {
			_links: {
				self:       { href: selfURL },
				collection: { href: parentURL,             title: 'Groupbuys list' },
				members:    { href: selfURL + '/members',  title: 'Manage members' },
				managers:   { href: selfURL + '/managers', title: 'Manage managers' },
				items:      { href: selfURL + '/items',    title: 'Items list' }
			},
			_id: 		 groupbuy._id,
			name: 		 groupbuy.name,
			title: 		 groupbuy.title,
			status: 	 groupbuy.status,
			description: groupbuy.description
		};

		if (showUpdates) {
			result.updates = groupbuy.updates;
		}

		if (showVisibilityInfo) {
			result.visibility = groupbuy.visibility;
		}

		if (showMembers) {
			result.members = groupbuy.members;
		}

		if (showManagers) {
			result.managers = groupbuy.managers;
		}

		if (showItems) {
			result._embedded = {items: []};
	/*
	TODO
				for (i = 0; i < groupbuy.items.length; i++) {
					result._embedded.items.push({
						href:  selfURL + '/items/' + groupbuy.items[i]._id,
						title: groupbuy.items[i].title,
						name:  groupbuy.items[i].name
					});
				}
	*/
		}
	}

	return result;
};

/**
 * Formatting groupbuy details to send
 */
var formattingGroupbuyList = exports.formattingGroupbuyList = function(groupbuys, req, options) {
	var selfURL = (typeof req.url !== 'undefined') ? req.url : '';

	// Prepare response in JSON+HAL format.
	var result = {
		_links: {
			self: { href: selfURL }
		},
		_embedded: {
			groupbuys: []
		}
	};

	// Adding paggination links to result collection
	result._links = _.assign(result._links, core.addPaginationLinks(selfURL, options) );

	// Adding embedded groupbuys
	if (groupbuys || typeof groupbuys !== 'undefined') {
		for (var i = 0; i < groupbuys.length; i++) {
			result._embedded.groupbuys.push( formattingGroupbuy(groupbuys[i], req, true) );
		}
	}

	return result;
};


/**
 * Create a Groupbuy
 */
exports.create = function(req, res) {
	var groupbuy = new Groupbuy(req.body);
	// Set user creator
	groupbuy.user = req.user;

	// Add user creator as manager and member
	groupbuy.addManager(groupbuy.user, function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(201).jsonp( formattingGroupbuy(groupbuy, req) );
		}
	});
};

/**
 * Show the current Groupbuy
 */
exports.read = function(req, res) {
	res.jsonp( formattingGroupbuy(req.groupbuy, req) );
};

/**
 * Update a Groupbuy
 */
exports.update = function(req, res) {
	var groupbuy = req.groupbuy ;

	delete req.body.user;
	groupbuy = _.extend(groupbuy , req.body);

	groupbuy.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * Delete a Groupbuy
 */
exports.delete = function(req, res) {
	var groupbuy = req.groupbuy;

	groupbuy.remove(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * List of Groupbuys
 */
exports.list = function(req, res) {
	var query  = req.query.filter || null,
		sort   = req.query.sort || 'title',
		limit  = req.query.limit || 25,
		page   = req.query.page || 1,
		fields = req.query.fields || '_id title name description status members manager user';

	Groupbuy.paginate(query, page, limit, function(err, totalPages, groupbuys, count) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingGroupbuyList(groupbuys, req, {page: page, totalPages: totalPages, numElems: limit, totalElems: count, selFields: fields}) );
		}
	}, { columns: fields, populate: ['user'], sortBy : sort });
};

/**
 * Add a member to an existing groupbuy
 */
exports.addMember = function(req, res) {
	var groupbuy = req.groupbuy,
		userId 	 = (req.body && req.body.userId && mongoose.Types.ObjectId.isValid(req.body.userId)) ? req.body.userId : undefined,
		err      = null;

	User.findById(userId, function(err, user) {
		if (!err && !user) {
			err = {message: 'You can not add the user as member. The user ID (' + userId + ') is not a valid.'};
		} else {
			groupbuy.addMember(userId, function(err) {
				if (err) {
					return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
				} else {
					res.status(204).end();
				}
			});
		}
		if (err) {
			return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
		}
	});
};

/**
 * Remove a member from an existing groupbuy
 */
exports.deleteMember = function(req, res) {
	var groupbuy = req.groupbuy,
		member   = req.profile,
		err      = null,
		index;

	// Check if user is a member of selected Groupbuy
	if ( (index = groupbuy.members.indexOf(member._id)) !== -1) {
		groupbuy.members.splice(index, 1);

		groupbuy.save(function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.set('Content-Type', 'application/vnd.hal+json');
				res.jsonp(groupbuy);
			}
		});
	} else {
		err = {message: 'You can not remove the user as member in this Groupbuy. The user is not member.'};
	}

	if (err) {
		return res.status(400).send({
			message: errorHandler.getErrorMessage(err)
		});
	}
};

/**
 * Get list of members in a groupbuy
 */
exports.getMembersList = function(req, res) {
	var query   = req.query.filter || null,
		sort    = _.keys(req.query.sort) || 'username',
		sortDir = _.values(req.query.sort)[0] || 1,
		limit   = req.query.limit || 25,
		page    = req.query.page || 1;

	Groupbuy.findById(req.groupbuy._id).populate('members', '_id name username avatar roles').exec(function(err, groupbuy) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			var count      = groupbuy.members.length,
				totalPages = Math.ceil(count / limit) || 1,
				members,
				options;

			// Sort the array
			members = _.sortByAll(groupbuy.members, sort);
			// If sortDir is -1, reverse the array
			if (parseInt(sortDir) === -1) { members = _(members).reverse().value(); }
			// Make pagination
			members = _.slice(members, (page * limit) - limit, (page * limit));
			// Fill options
			options = {page: page, totalPages: totalPages, numElems: limit, totalElems: members.length, collectionName: 'members'};

			res.jsonp( users.formattingUserList(members, req, options) );
		}
	});
};

/**
 * Add a manager to an existing groupbuy
 */
exports.addManager = function(req, res) {
	var groupbuy = req.groupbuy,
		userId 	 = (req.body && req.body.userId && mongoose.Types.ObjectId.isValid(req.body.userId)) ? req.body.userId : undefined,
		err      = null;

	User.findById(userId, function(err, user) {
		if (!err && !user) {
			err = {message: 'You can not add the user as manager. The user ID (' + userId + ') is not a valid.'};
		} else {
			groupbuy.addManager(userId, function(err) {
				if (err) {
					return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
				} else {
					res.status(204).end();
				}
			});
		}
		if (err) {
			return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
		}
	});

};

/**
 * Remove a manager from an existing groupbuy
 */
exports.deleteManager = function(req, res) {
	var groupbuy  = req.groupbuy,
		manager   = req.profile,
		err       = null,
		index;

	// Check is are many managers
	if (groupbuy.managers.length > 1) {

		// Check if user is a manager of selected Groupbuy
		if ( (index = groupbuy.managers.indexOf(manager._id)) !== -1) {
			groupbuy.managers.splice(index, 1);

			groupbuy.save(function(err) {
				if (err) {
					return res.status(400).send({
						message: errorHandler.getErrorMessage(err)
					});
				} else {
					res.set('Content-Type', 'application/vnd.hal+json');
					res.jsonp(groupbuy);
				}
			});
		} else {
			err = {message: 'You can not remove the user as manager in this Groupbuy. The user is not manager.'};
		}
	} else {
		err = {message: 'You can not remove the user as manager in this Groupbuy. The user is the last manager.'};
	}

	if (err) {
		return res.status(400).send({
			message: errorHandler.getErrorMessage(err)
		});
	}
};

/**
 * Get list of managers in a groupbuy
 */
exports.getManagersList = function(req, res) {
	var query   = req.query.filter || null,
		sort    = _.keys(req.query.sort) || 'username',
		sortDir = _.values(req.query.sort)[0] || 1,
		limit   = req.query.limit || 25,
		page    = req.query.page || 1;

	Groupbuy.findById(req.groupbuy._id).populate('managers', '_id name username avatar roles').exec(function(err, groupbuy) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			var count      = groupbuy.managers.length,
				totalPages = Math.ceil(count / limit) || 1,
				managers,
				options;

			// Sort the array
			managers = _.sortByAll(groupbuy.managers, sort);
			// If sortDir is -1, reverse the array
			if (parseInt(sortDir) === -1) { managers = _(managers).reverse().value(); }
			// Make pagination
			managers = _.slice(managers, (page * limit) - limit, (page * limit));
			// Fill options
			options = {page: page, totalPages: totalPages, numElems: limit, totalElems: managers.length, collectionName: 'managers'};

			res.jsonp( users.formattingUserList(managers, req, options) );
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
		req.groupbuy = groupbuy;
		next();
	});
};


/**
 * Groupbuy authorization middleware by roles
 */
exports.hasAuthorization = function(roles) {
	return function(req, res, next) {
		return next();

	/*
	console.log(req.groupbuy);

		if (_.intersection(req.groupbuy.getRoles(req.user), roles).length) {
			return next();
		} else {
			return res.status(403).send({
				name: 'NotAuthorized',
				message: 'User is not authorized'
			});
		}
		*/
	};
};

/**
 * Groupbuy authorization middleware by visibility configuration
 */
exports.hasVisibility = function(property) {
	return function(req, res, next) {
		if (req.groupbuy && req.groupbuy.checkVisibility(req.user, property) ) {
			return next();
		} else {
			return res.status(403).send({
				name: 'NotAuthorized',
				message: 'User is not authorized'
			});
		}
	};
};
