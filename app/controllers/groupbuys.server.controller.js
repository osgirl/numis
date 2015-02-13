'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	User = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy'),
	_ = require('lodash');


var checkVisibility = function(groupbuy, property, isAdmin, isMember, isManager) {
	if (isAdmin)
		return true;

		return (groupbuy.visibility[property] === 'public' || 
				groupbuy.visibility[property] === 'restricted' && isMember || 
				groupbuy.visibility[property] === 'private' && isManager
			   );
	};



/**
 * Formatting groupbuy details to send
 */
var formattingGroupbuy = exports.formattingGroupbuy = function(groupbuy, req) {
	var user 	  	 = req.user,
		isAdmin   	 = (user && user.roles && user.roles.indexOf('admin') !== -1),
		isMember  	 = (isAdmin || groupbuy.members.indexOf(user._id) !== -1),
		isManager 	 = (isAdmin || groupbuy.managers.indexOf(user._id) !== -1),
		showUpdates  = isMember,
		showVisibilityInfo = isManager,
		showMembers  = checkVisibility(groupbuy, 'members', isAdmin, isMember, isManager),
		showManagers = checkVisibility(groupbuy, 'managers', isAdmin, isMember, isManager),
		showItems 	 = checkVisibility(groupbuy, 'items', isAdmin, isMember, isManager),
		result 	  	 = {},
		i;

	/* visibility TODO
			shipmentsState: 'restricted',
			paymentStatus: 'restricted',
			itemsByMember: 'restricted',
			itemNumbers: 'public',
	*/

	if (user && user._id && groupbuy && groupbuy._id) {
		var selfURL = req.method === 'GET' ? req.url : req.url + '/' + groupbuy._id;

		// Prepare response in JSON+HAL format.
		result = {
			_links: {
				self:     { href: selfURL },
				members:  { href: selfURL + '/members', title: 'Manage members' },
				managers: { href: selfURL + '/managers', title: 'Manage managers' },
			},
			_id: 	groupbuy._id,
			name: 	groupbuy.name,
			title: 	groupbuy.title,
			status: groupbuy.status,
			description: groupbuy.description,
			members:  [],
			managers: []
		};

		if (showUpdates) {
			result.updates = groupbuy.updates;
		}

		if (showVisibilityInfo) {
			result.visibility = groupbuy.visibility;
		}

		if (showMembers) {
			for (i = 0; i < groupbuy.members.length; i++) {
				result.members.push( groupbuy.members[i]._id );
			}
		}

		if (showManagers) {
			for (i = 0; i < groupbuy.managers.length; i++) {
				result.managers.push( groupbuy.managers[i]._id );
			}
		}

		if (showItems && false) {
			for (i = 0; i < groupbuy.items.length; i++) {
				result._links.items = {
					href:  selfURL + '/items/' + groupbuy.items[i]._id,
					title: groupbuy.items[i].title,
					name:  groupbuy.items[i].name
				};
			}
		}
	}

	return result;
};

/**
 * Formatting groupbuy details to send
 */
var formattingGroupbuyList = exports.formattingGroupbuyList = function(groupbuys, req) {
	var user 	= req.user,
		isAdmin = (user && user.roles && user.roles.indexOf('admin') !== -1);

	// Prepare response in JSON+HAL format.
	var result = {
		_links: {
			self: {
				href: req.url
			}
		},
		_embedded: {
			groupbuys: []
		}
	};

	for (var i = 0; i < groupbuys.length; i++) {
		result._embedded.groupbuys.push({
			_links: {
				self: { href: req.url + '/' + groupbuys[i]._id }
			},
			_id: 	groupbuys[i]._id,
			title: 	groupbuys[i].title,
			name: 	groupbuys[i].name,
			status: groupbuys[i].status,
			description: groupbuys[i].description
		});
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
	groupbuy.members  = [ groupbuy.user ];
	groupbuy.managers = [ groupbuy.user ];

	groupbuy.save(function(err) {
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
	Groupbuy.find().select('_id title name description status members manager user').sort('title').populate('user', 'username roles').exec(function(err, groupbuys) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingGroupbuyList(groupbuys, req) );
		}
	});
};

/**
* Add a member to an existing groupbuy
*/
exports.addMember = function(req, res) {
	var groupbuy = req.groupbuy,
		userId 	 = (req.body && req.body.userId && mongoose.Types.ObjectId.isValid(req.body.userId)) ? req.body.userId : undefined,
		err      = null;

	// TODO !! ñapa
	//
	// TODO: Esto no queda nada bonito aquí.
	// Check user is a valid user
	User.findById(userId, function(err, user) {
		if (!err && !user) {
			err = {message: 'You can not add the user as member. The user ID (' + userId + ') is not a valid.'};
		} else {
			// Check if user is a member yet
			if (groupbuy.members.indexOf(userId) === -1) {
				groupbuy.members.push(userId);

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
				err = {message: 'You can not add the user to this Groupbuy. The user is already member.'};
			}
		}
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
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
// TODO: Refactorizar
exports.getMembersList = function(req, res) {
	Groupbuy.findById(req.groupbuy._id).populate('members').exec(function(err, groupbuy) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// FIXME: Use formattingUser
			var result = {
				_links: {
					self: {
						href: '/api/v1/groupbuys/' + req.groupbuy._id + '/members'
					}
				},
				_embedded: {
					users: []
				}
			};

			for (var i = 0; i < groupbuy.members.length; i++) {
				result._embedded.users.push({
					_links: {
						self: {href: '/api/v1/users/' + groupbuy.members[i]._id},
						avatar: {
							href: '/api/v1/users/' + groupbuy.members[i]._id + '/avatar{?size}',
							title: 'Avatar image',
							templated: true
						}
					},
					_id: groupbuy.members[i]._id,
					username: groupbuy.members[i].username,
					name: groupbuy.members[i].name

				});
			}

			res.jsonp( result );
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

	// TODO !! ñapa
	//
	// TODO: Esto no queda nada bonito aquí.
	// Check user is a valid user
	User.findById(userId, function(err, user) {
		if (!err && !user) {
			err = {message: 'You can not add the user as manager. The user ID (' + userId + ') is not a valid.'};
		} else {
			// Check if user is a manager yet
			if (groupbuy.managers.indexOf(userId) === -1) {
				groupbuy.managers.push(userId);

				// Add manager as member of Groupbuy.
				if (groupbuy.members.indexOf(userId) === -1) {
					groupbuy.members.push(userId);
				}

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
				err = {message: 'You can not add the user as manager in this Groupbuy. The user is already manager.'};
			}
		}
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
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
* Get list of members in a groupbuy
*/
// TODO: Refactorizar
exports.getManagersList = function(req, res) {
	Groupbuy.findById(req.groupbuy._id).populate('managers').exec(function(err, groupbuy) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// FIXME: Use formattingUser
			var result = {
				_links: {
					self: {
						href: '/api/v1/groupbuys/' + req.groupbuy._id + '/managers'
					}
				},
				_embedded: {
					users: []
				}
			};

			for (var i = 0; i < groupbuy.managers.length; i++) {
				result._embedded.users.push({
					_links: {
						self: {href: '/api/v1/users/' + groupbuy.managers[i]._id},
						avatar: {
							href: '/api/v1/users/' + groupbuy.managers[i]._id + '/avatar{?size}',
							title: 'Avatar image',
							templated: true
						}
					},
					_id: groupbuy.managers[i]._id,
					username: groupbuy.managers[i].username,
					name: groupbuy.managers[i].name

				});
			}

			res.jsonp( result );
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
 * Groupbuy authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.groupbuy.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
