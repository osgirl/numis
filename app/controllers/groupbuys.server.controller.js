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
	Groupbuy     = mongoose.model('Groupbuy'),
	Order        = mongoose.model('Order'),
	allStates    = ['new', 'published', 'acceptance', 'payments', 'paid', 'shipments', 'closed', 'cancelled', 'deleted'],
	cicleOfLife  = _.dropRight(allStates, 2), // All states except cancelled and deleted
	goToStates   = _.dropRight(_.drop(allStates)); // All states except new and deleted

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
		showVisibilityInfo = !reduce,
		showMembers  = !reduce && groupbuy.checkVisibility(user, 'members'),
		showManagers = !reduce && groupbuy.checkVisibility(user, 'managers'),
		result 	  	 = {},
		i;

	/* visibility TODO
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
				items:      { href: selfURL + '/items',    title: 'Items list' },
				messages:   { href: selfURL + '/messages', title: 'Conversations' }
			},
			_id:         groupbuy._id,
			name:        groupbuy.name,
			title: 	     groupbuy.title,
			description: groupbuy.description,
			status: 	 groupbuy.status,
			currencies: {
				local: {
					_id: 	groupbuy.currencies.local._id,
					name: 	groupbuy.currencies.local.name,
					code: 	groupbuy.currencies.local.code,
					symbol: groupbuy.currencies.local.symbol
				},
				provider: {
					_id: 	groupbuy.currencies.provider._id,
					name: 	groupbuy.currencies.provider.name,
					code: 	groupbuy.currencies.provider.code,
					symbol: groupbuy.currencies.provider.symbol
				},
				exchangeRate: groupbuy.currencies.exchangeRate,
				multiplier:   groupbuy.currencies.multiplier
			},
			shippingCost: groupbuy.shippingCost,
			otherCosts: groupbuy.otherCosts
		};

		// Add next state property
		if (groupbuy.status === 'cancelled' || groupbuy.status === 'deleted'  || groupbuy.status === 'closed') {
			result.nextState = groupbuy.status;
		} else {
			var pos = cicleOfLife.indexOf(groupbuy.status);

			if (pos > -1 && pos < cicleOfLife.length -1) {
				result.nextState = cicleOfLife[pos+1];
			} else {
				result.nextState = '';
			}
		}


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

	// Adding count properties
	if ( options.numElems !== 'undefined' )   { result.numElems = options.numElems; }
	if ( options.totalElems !== 'undefined' ) { result.totalElems = options.totalElems; }

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
		}
		// Populate currencies
		groupbuy.populate([
				{path: 'currencies.local', select: 'id name code symbol'},
				{path: 'currencies.provider', select: 'id name code symbol'}
		], function(err) {
			if (err) {
				return res.status(400).send( errorHandler.prepareErrorResponse (err) );
			}

			var socketio = req.app.get('socketio');
			socketio.sockets.emit('groupbuy.created', groupbuy);

			res.status(201).jsonp( formattingGroupbuy(groupbuy, req) );
		});
	});
};

/**
 * Show the current Groupbuy
 */
exports.read = function(req, res) {
	if (req.groupbuy.status === 'deleted')
		return res.status(400).send( errorHandler.prepareErrorResponse( new Error('Failed to load Groupbuy ' + req.groupbuy.id) ));

	res.jsonp( formattingGroupbuy(req.groupbuy, req) );
};

/**
 * Update a Groupbuy
 */
exports.update = function(req, res) {
	var groupbuy = req.groupbuy;

	// Filter data to be updated
	delete req.body.status;
	delete req.body.items;
	delete req.body.managers;
	delete req.body.members;
	delete req.body.user;

	if (typeof req.body.currencies !== 'undefined') {
		if (typeof req.body.currencies.local !== 'undefined' && typeof req.body.currencies.local._id !== 'undefined') {
			req.body.currencies.local = req.body.currencies.local._id;
		}
		if (typeof req.body.currencies.provider !== 'undefined' && typeof req.body.currencies.provider._id !== 'undefined') {
			req.body.currencies.provider = req.body.currencies.provider._id;
		}
	}

	groupbuy = _.extend(groupbuy , req.body);

	groupbuy.save(function(err, groupbuy) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		}
		// Populate currencies
		groupbuy.populate([
				{path: 'currencies.local', select: 'id name code symbol'},
				{path: 'currencies.provider', select: 'id name code symbol'}
		], function(err) {
			if (err) {
				return res.status(400).send( errorHandler.prepareErrorResponse (err) );
			}
			res.jsonp( formattingGroupbuy(groupbuy, req) );
		});
	});
};

/**
 * Delete a Groupbuy
 */
exports.delete = function(req, res) {
	var groupbuy = req.groupbuy;

	// Soft / logical delete
	groupbuy.update({status: 'deleted'}, function(err) {
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
		sort,
		limit  = req.query.limit || 25,
		page   = req.query.page || 1,
		fields = req.query.fields || '_id title name description status members manager currencies user';

	// Filter deleted groupbuys
	if (!query) {
		query = { status: {$ne: 'deleted'} };
	} else {
		query = { $and: [query, {status: {$ne: 'deleted'}} ] };
	}

	// Add query filters and default sorting
	if (!req.profile && typeof req.profile === 'undefined') {
		/* /groupbuys -- Show all groupbuys */
		sort = req.query.sort || {title: 1};

	} else if (req.profile && typeof req.profile !== 'undefined') {
		/* /users/:userId/groupbuys -- Show groupbys filtered by user */
		query = {$or: [
				    { members:  req.profile._id },
				    { managers: req.profile._id }
				],
				status: {$ne: 'deleted'}
		};
		sort = req.query.sort || 'title';

	} else {
		// Invalid
		return res.status(400).send( {message: 'Unsupported request!'} );
	}

	Groupbuy.paginate(query, page, limit, function(err, totalPages, groupbuys, count) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingGroupbuyList(groupbuys, req, {page: page, totalPages: totalPages, numElems: groupbuys.length, totalElems: count, selFields: fields}) );
		}
	}, { columns: fields, populate: ['user', 'currencies.local', 'currencies.provider'], sortBy : sort });
};

/**
 * Change the state in a Groupbuy
 */
exports.changeState = function(req, res) {
	var groupbuy = req.groupbuy;

	groupbuy.update({status: req.state}, function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		}
		// Populate currencies
		groupbuy.populate([
				{path: 'currencies.local', select: 'id name code symbol'},
				{path: 'currencies.provider', select: 'id name code symbol'}
		], function(err) {
			if (err)
				return res.status(400).send( errorHandler.prepareErrorResponse (err) );

			groupbuy.status = req.state;
			res.jsonp( formattingGroupbuy(groupbuy, req) );
		});
	});
};


/**
 * Add a member to an existing groupbuy
 */
exports.addMember = function(req, res) {
	var groupbuy = req.groupbuy,
		userId 	 = (req.body && req.body.userId && mongoose.Types.ObjectId.isValid(req.body.userId)) ? req.body.userId : undefined,
		err      = null;

	// Check that the user add himself or have admin role
	if (userId !== req.user.id && !req.user.isAdmin() ) {
		return res.status(403).send({name: 'NotAuthorized', message: 'User is not authorized'});

	} else {
		User.findById(userId, function(err, user) {
			if (!err && !user) {
				err = {message: 'You can not add the user as member. The user ID (' + userId + ') is not a valid.'};
			} else {
				groupbuy.addMember(userId, function(err) {
					if (err) {
						return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
					}

					// Create empty order for the new member
					var order = new Order({
							user: userId,
							groupbuy: groupbuy.id
					});

					order.save(function(err) {
						if (err) {
							return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
						}

						res.status(204).end();
					});
				});
			}
			if (err) {
				return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
			}
		});
	}
};

/**
 * Remove a member from an existing groupbuy
 */
exports.deleteMember = function(req, res) {
	var groupbuy = req.groupbuy,
		member   = req.profile,
		err      = null,
		index;

	// Check that the user add himself or have admin role
	if (member.id !== req.user.id && !groupbuy.isManager(req.user._id) && !req.user.isAdmin() ) {
		return res.status(403).send({name: 'NotAuthorized', message: 'User is not authorized'});

	} else {
		// Check if user is a member of selected Groupbuy
		if ( (index = groupbuy.members.indexOf(member._id)) !== -1) {
			groupbuy.members.splice(index, 1);

			groupbuy.save(function(err) {
				if (err)
					return res.status(400).send({ message: errorHandler.getErrorMessage(err) });

				// Remove all order associated to this user in this groupbuy
				Order.findOneAndRemove({user: member.id, groupbuy: groupbuy.id}, function(err) {
					if (err)
						return res.status(400).send({ message: errorHandler.getErrorMessage(err) });

					res.status(204).end();
				});
			});
		} else {
			err = {message: 'You can not remove the user as member in this Groupbuy. The user is not member.'};
		}

		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		}
	}
};

/**
 * Get list of members in a groupbuy
 */
exports.getMembersList = function(req, res) {
	var query   = req.query.filter || null,
		sort,
		sortDir,
		limit   = req.query.limit || 25,
		page    = req.query.page || 1;

	sort    = (req.query.sort && _.keys(req.query.sort).length > 0) ? _.keys(req.query.sort) : 'username';
	sortDir = (req.query.sort && _.values(req.query.sort).length > 0) ? _.values(req.query.sort)[0] : 1;

	Groupbuy.findById(req.groupbuy._id).populate('members', '_id name username avatar roles').exec(function(err, groupbuy) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			var count      = groupbuy.members.length,
				totalPages = Math.ceil(count / limit) || 1,
				totalElems,
				members,
				options;

			// Sort the array
			members = _.sortByAll(groupbuy.members, sort);

			// Count all managers
			totalElems = members.length;

			// If sortDir is -1, reverse the array
			if (parseInt(sortDir) === -1) { members = _(members).reverse().value(); }
			// Make pagination
			members = _.slice(members, (page * limit) - limit, (page * limit));
			// Fill options
			options = {page: page, totalPages: totalPages, numElems: members.length, totalElems: totalElems, collectionName: 'members'};

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
				}

				// Create empty order for the new manager
				var order = new Order({
						user: userId,
						groupbuy: groupbuy.id
				});

				order.save(function(err) {
					if (err) {
						return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
					}

					res.status(204).end();
				});
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
				if (err)
					return res.status(400).send({ message: errorHandler.getErrorMessage(err) });

				// Remove all order associated to this user in this groupbuy
				Order.findOneAndRemove({user: manager.id, groupbuy: groupbuy.id}, function(err) {
					if (err)
						return res.status(400).send({ message: errorHandler.getErrorMessage(err) });

					res.status(204).end();
				});
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
		sort,
		sortDir,
		limit   = req.query.limit || 25,
		page    = req.query.page || 1;

	sort    = (req.query.sort && _.keys(req.query.sort).length > 0) ? _.keys(req.query.sort) : 'username';
	sortDir = (req.query.sort && _.values(req.query.sort).length > 0) ? _.values(req.query.sort)[0] : 1;

	Groupbuy.findById(req.groupbuy._id).populate('managers', '_id name username avatar roles').exec(function(err, groupbuy) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			var count      = groupbuy.managers.length,
				totalPages = Math.ceil(count / limit) || 1,
				totalElems,
				managers,
				options;

			// Sort the array
			managers = _.sortByAll(groupbuy.managers, sort);

			// Count all managers
			totalElems = managers.length;

			// If sortDir is -1, reverse the array
			if (parseInt(sortDir) === -1) { managers = _(managers).reverse().value(); }
			// Make pagination
			managers = _.slice(managers, (page * limit) - limit, (page * limit));
			// Fill options
			options = {page: page, totalPages: totalPages, numElems: managers.length, totalElems: totalElems, collectionName: 'managers'};

			res.jsonp( users.formattingUserList(managers, req, options) );
		}
	});
};


/**
 * Groupbuy middleware
 */
exports.groupbuyByID = function(req, res, next, id) {
	Groupbuy.findById(id)
		.populate('user', 'username')
		.populate('currencies.local', 'id name code symbol')
		.populate('currencies.provider', 'id name code symbol')
		.exec(function(err, groupbuy) {
			if (err) return res.status(400).send( errorHandler.prepareErrorResponse(err) );
			if (!groupbuy)
				return res.status(400).send( errorHandler.prepareErrorResponse( new Error('Failed to load Groupbuy ' + id) ));

			req.groupbuy = groupbuy;
			next();
		});
};

exports.stateParam = function(req, res, next, state) {
	// Check the state param is valid
	if (!state || goToStates.indexOf(state) === -1) {
		return res.status(400).send({
			name: 'ValidationError',
			message: 'Invalid state ' + state
		});
	}

	// If actual state is cancelled, deleted or closed the user must be admin
	if (['cancelled', 'deleted', 'closed'].indexOf(req.groupbuy.status) !== -1) {
		if(!req.user.isAdmin()) {
			return res.status(403).send({
				name: 'NotAuthorized',
				message: 'User is not authorized'
			});
		}
	} else {
		if (state === 'cancelled') {
			// To change to cancelled state, the actual state mustn't be new, published nor closed.
			if (['new', 'published', 'closed'].indexOf(req.groupbuy.status) !== -1) {
				return res.status(400).send({
					name: 'ValidationError',
					message: 'Invalid change state. The groupbuy isn\'t suitable to be cancelled.'
				});
			}

		} else if (state === 'deleted') {
			// To change to deleted state, the actual state must be be new or published.
			if (['new', 'published'].indexOf(req.groupbuy.status) === -1) {
				return res.status(400).send({
					name: 'ValidationError',
					message: 'Invalid change state. The groupbuy isn\'t suitable to be deleted.'
				});
			}
		} else {
			// Normal change state, the new state must be the next in the groupbuy cicle of life.
			var actualPos = allStates.indexOf(req.groupbuy.status),
				newPos    = allStates.indexOf(state);

			if (actualPos === -1 || newPos === -1 || newPos - actualPos !== 1) {
				return res.status(400).send({
					name: 'ValidationError',
					message: 'Invalid change state. Valid destination state is ' + allStates[actualPos+1]
				});
			}
		}
	}

	req.state = state;
	next();
};


/**
 * Groupbuy authorization middleware by roles
 */
exports.hasAuthorization = function(roles) {
	return function(req, res, next) {
		if (_.intersection(req.groupbuy.getRoles(req.user), roles).length) {
			return next();
		} else {
			return res.status(403).send({
				name: 'NotAuthorized',
				message: 'User is not authorized'
			});
		}
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
