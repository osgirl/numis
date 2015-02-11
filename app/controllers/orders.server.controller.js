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
var formattingOrder = function(order, req) {
	var result = {};

	if (order && order._id) {
		// Duplicate object order
		result = order.toJSON();

console.log (result);

		// Add links to response
		if (req && req.url) {
			var selfURL = req.method === 'GET' ? req.url : req.url + '/' + result._id;
			result._links = {
				self: { href: selfURL },
				user: {
					href: '/api/v1/users/' + order.user._id,
					title: 'User creator'
				},
				groupbuy: {
					href: '/api/v1/groupbuys/' + order.groupbuy,
					title: 'Groupbuy to which belongs to'
				}
			};
		}

		// Remove fields
		delete result.__v;
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
		// Duplicate object order
		order = orders[i].toJSON();

		// Add relational links
		order._links = {
			self: { href: req.url + '/' + order._id },
		};

		// Remove internal fields
		//delete order.user;
		//delete order.groupbuy;

		// Add order to array
		result._embedded.orders.push(order);
	}

	// Send response
	return result;
};


/**
 * Create a Order
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
 * Update a Order
 */
exports.update = function(req, res) {
	var order = req.order ;

	order = _.extend(order , req.body);

	order.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
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
	// TODO: sort by:
	//			a) General: updated
	//			b) User orders: updated
	//			c) Groupbuy orders: User name

	Order.find().sort('-created').populate('user', 'username').populate('groupbuy', 'title').exec(function(err, orders) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingOrderList(orders, req) );
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
