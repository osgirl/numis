'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Order = mongoose.model('Order'),
	_ = require('lodash');


/**
 * Formatting order details to send
 */
var formattingOrder = function(order, req, reduce) {
	reduce = reduce || false;

	var selfURL = '',
		parentURL = '',
		creatorURL = '',
		groupbuyURL = '',
		result = {};

	if (order && order._id) {
		try {
			selfURL     = order.toLink();
			parentURL   = selfURL.replace(/\/[a-f\d]{24}$/i, '');
		} catch (ex) {
			console.trace(ex);
		}

		if(!reduce) {
			try {
				var rels = order.relationsToLink(['user', 'groupbuy']);

				if (order.populated('user') !== undefined) {
					creatorURL  = '/api/v1' + order.idToLink(order.user.id, 'User', [], {});
				} else {
					creatorURL  = '/api/v1' + rels.user;
				}

				if (order.populated('groupbuy') !== undefined) {
					groupbuyURL  = '/api/v1' + order.idToLink(order.groupbuy.id, 'User', [], {});
				} else {
					groupbuyURL  = '/api/v1' + rels.groupbuy;
				}
			} catch (ex) {
				console.trace(ex);
			}
		}

		// Duplicate object order
		result = order.toObject( {depopulate:true, getters: true} );

		// Add links to response
		result._links = {
			self: { href: selfURL }
		};
		if(!reduce) {
			result._links.user     = { href: creatorURL, title: 'User creator' };
			result._links.groupbuy = { href: groupbuyURL, title: 'Groupbuy to which belongs to' };
		}

		// Remove fields
		delete result.__v;
		delete result.groupbuy;
		delete result.user;
	}

	return result;
};

/**
 * Formatting orders list to send
 */
var formattingOrderList = function(orders, req) {
	var order;
	var result = {
		_links: {
			self: { href: req.url }
		},
		_embedded: {
			orders: []
		}
	};

	for (var i = 0; i < orders.length; i++) {
		result._embedded.orders.push( formattingOrder(orders[i], req, true) );
	}

	// Send response
	return result;
};


/**
 * Create an Order
 */
exports.create = function(req, res) {
	var order = new Order(req.body);
	order.user = req.user;

	order.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(201).jsonp( formattingOrder(order, req) );
		}
	});
};

/**
 * Show the current Order
 */
exports.read = function(req, res) {
	res.jsonp( formattingOrder(req.order, req) );
};

/**
 * Update an Order
 */
exports.update = function(req, res) {
	var order = req.order,
		dirty = false;

	// TODO: Only groupbuy managers can update a request costs

	if (req.body !== undefined && req.body.shippingCost !== undefined) {
		order.shippingCost = req.body.shippingCost;
		dirty = true;
	}
	if (req.body !== undefined && req.body.otherCosts !== undefined) {
		order.otherCosts = req.body.otherCosts;
		dirty = true;
	}

	if (dirty) {
		order.save(function(err) {
			if (err) {
				return res.status(400).send( errorHandler.prepareErrorResponse (err) );
			} else {
				res.status(204).end();
			}
		});
	} else {
		res.status(400).send({message: 'There is not valid fields to update'});
	}
};

/**
 * Delete an Order
 */
exports.delete = function(req, res) {
	var order = req.order ;

	order.remove(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * List of Orders
 */
exports.list = function(req, res) {
	var query = {},
		sort,
		limit = req.param.limit || 25,
		offset = req.param.offset || 0;

	if (!req.profile && !req.groupbuy && typeof req.profile === 'undefined' && typeof req.groupbuy === 'undefined') {
		//  /orders -- Show all orders
		// TODO: Admin profile required
		sort = req.param.sort || '-updated';

	} else if (req.profile && typeof req.profile !== 'undefined') {
		//  /users/:userId/orders -- Show orders filtered by user
		// TODO: Admin or itself
		query = {user: req.profile};
		sort  = req.param.sort || '-updated';

	} else if (req.groupbuy && typeof req.groupbuy !== 'undefined') {
		//  /groupbuys/:groupbuyId/orders -- Show orders filtered by groupbuy
		// TODO: Admin or groupbuy manager
		query = {groupbuy: req.groupbuy};
		sort  = req.param.sort || 'user.username';

	} else {
		// Invalid
		return res.status(400).send( {message: 'Unsupported request!'} );
	}

	Order.find(query).populate('user', 'username').populate('groupbuy', 'title').sort(sort).exec(function(err, orders) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingOrderList(orders, req) );
		}
	});
};

/**
 * Adding a request to an Order
 */
exports.addRequest = function(req, res) {
	var order   = req.order,
		request = req.body,
		user    = req.user;

	// TODO: Only groupbuy managers or Order user can add requests

	order.addRequest(request, user, function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingOrder(order, req) );
		}
	});
};

/**
 * Removing a request from an Order
 */
exports.removeRequest = function(req, res) {
	var order = req.order,
		id    = req.body.id;

	// TODO: Only platform admins can remove requests

	order.removeRequest(id, function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingOrder(order, req) );
		}
	});
};

/**
 * Removing a request from an Order
 */
exports.calculateSummary = function(req, res) {
	var order = req.order;

	// TODO: Only managers can invoke calculate Summary method

	order.calculateSummary(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingOrder(order, req) );
		}
	});
};


/**
 * Order middleware
 */
exports.orderByID = function(req, res, next, id) {
	Order.findById(id).populate('user', 'username').populate('groupbuy', 'title').exec(function(err, order) {
		if (err) return next(err);
		if (! order) return next(new Error('Failed to load Order ' + id));
		req.order = order ;
		next();
	});
};

/**
 * Order authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.order.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
