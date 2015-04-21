'use strict';

/**
 * Module dependencies.
 */
var mongoose     = require('mongoose'),
	core         = require('./core.server.controller'),
	errorHandler = require('./errors.server.controller'),
	groupbuys    = require('./groupbuys.server.controller'),
	_            = require('lodash'),
	Order        = mongoose.model('Order');


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
			selfURL     = '/api/v1' + order.toLink();
			parentURL   = selfURL.replace(/\/[a-f\d]{24}$/i, '');
		} catch (ex) {
			console.trace(ex);
		}

		if(!reduce) {
			try {
				var rels = order.relationsToLink(['user', 'groupbuy'], ['user', 'groupbuy']);

				if (order.populated('user') !== undefined) {
					creatorURL  = '/api/v1' + order.idToLink(order.user.id, 'User', [], {});
				} else {
					creatorURL  = '/api/v1' + rels.user;
				}

				if (order.populated('groupbuy') !== undefined) {
					groupbuyURL  = '/api/v1' + order.idToLink(order.groupbuy.id, 'Groupbuy', [], {});
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
var formattingOrderList = function(orders, req, options) {
	var selfURL = (typeof req.url !== 'undefined') ? req.url : '';

	// Prepare response in JSON+HAL format.
	var result = {
		_links: {
			self: { href: selfURL }
		},
		_embedded: {
			orders: []
		}
	};

	// Adding count properties
	if ( options.numElems !== 'undefined' )   { result.numElems = options.numElems; }
	if ( options.totalElems !== 'undefined' ) { result.totalElems = options.totalElems; }

	// Adding paggination links to result collection
	result._links = _.assign(result._links, core.addPaginationLinks(selfURL, options) );

	// Adding embedded orders
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
	var order = new Order({
			user: req.user,
			groupbuy: req.groupbuy
	});

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
 * only fields providerShippingCost, shippingCost and otherCosts can be updated.
 */
exports.update = function(req, res) {
	var order = req.order,
		dirty = false;

	if (req.body !== undefined && req.body.shippingCost !== undefined) {
		order.shippingCost = req.body.shippingCost;
		dirty = true;
	}
	if (req.body !== undefined && req.body.otherCosts !== undefined) {
		order.otherCosts = req.body.otherCosts;
		dirty = true;
	}

	if (dirty) {
		order.save(function(err, order) {
			if (err) {
				return res.status(400).send( errorHandler.prepareErrorResponse (err) );
			} else {
				res.jsonp( formattingOrder(order, req) );
			}
		});
	} else {
		res.status(400).send( {message: 'There is not valid fields to update'} );
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
		limit = req.query.limit || 25,
		page  = req.query.page || 1,
		fields = req.query.fields || null;

	// Add query filters and default sorting
	if (!req.profile && !req.groupbuy && typeof req.profile === 'undefined' && typeof req.groupbuy === 'undefined') {
		/* /orders -- Show all orders */
		sort = req.query.sort || {updated: -1};

	} else if (req.profile && typeof req.profile !== 'undefined') {
		/* /users/:userId/orders -- Show orders filtered by user */
		query = {user: req.profile};
		sort  = req.query.sort || '-updated';

	} else if (req.groupbuy && typeof req.groupbuy !== 'undefined') {
		/* /groupbuys/:groupbuyId/orders -- Show orders filtered by groupbuy */
		query = {groupbuy: req.groupbuy};
		sort  = req.query.sort || 'user.username';

	} else if (req.profile && typeof req.profile !== 'undefined' && req.groupbuy && typeof req.groupbuy !== 'undefined') {
		/* /groupbuys/:groupbuyId/users/:userId/orders -- Show orders filtered by user and groupbuy */
		query = {user: req.profile, groupbuy: req.groupbuy};
		sort  = req.query.sort || '-updated';

	} else {
		// Invalid
		return res.status(400).send( {message: 'Unsupported request!'} );
	}

	Order.paginate(query, page, limit, function(err, totalPages, orders, count) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingOrderList(orders, req, {page: page, totalPages: totalPages, numElems: orders.length, totalElems: count, selFields: fields}) );
		}
	}, { columns: fields, populate: ['user', 'groupbuy'], sortBy : sort });
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
		if (err) return res.status(400).send( errorHandler.prepareErrorResponse(err) );
		if (!order)
			return res.status(400).send( errorHandler.prepareErrorResponse( new Error('Failed to load Order ' + id) ));

		req.order = order;

		// Call Groupbuy middleware
		groupbuys.groupbuyByID(req, res, next, order.groupbuy);
	});
};
