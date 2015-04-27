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

		// Number of members in groupbuy
		try {
			if (order.groupbuy.shippingCost !== undefined && !isNaN(order.groupbuy.shippingCost) ) {
				order.providerShippingCost = order.groupbuy.shippingCost / order.groupbuy.members.length;

			} else if (typeof req.groupbuy.shippingCost !== 'undefined' && !isNaN(req.groupbuy.shippingCost) ) {
				order.providerShippingCost = req.groupbuy.shippingCost / req.groupbuy.members.length;
			}
			order.total = order.subtotal + order.providerShippingCost + order.shippingCost + order.otherCosts;
		} catch (err) {
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

		// payment
		result.payment.received = result.payment.confirmationDate !== undefined && result.payment.confirmationDate !== null;
		result.payment.paid     = result.payment.date !== undefined && result.payment.date !== null;

		// shipping
		if (result.shipping.confirmationDate !== null) result.shipping.received = true;
		if (result.shipping.date !== null)             result.shipping.shipped = true;

		// Remove fields
		delete result.__v;
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
		dirty = false,
		data = {};

	if (req.body !== undefined && (req.body.shippingCost !== undefined || req.body.otherCosts) ) {
		data = req.body;
		
	} else if (req.query !== undefined && (req.query.shippingCost !== undefined || req.query.otherCosts) ) {
		data = req.query;
	}

	if (data.shippingCost !== undefined) {
		order.shippingCost = data.shippingCost;
		dirty = true;
	}
	if (data.otherCosts !== undefined) {
		order.otherCosts = data.otherCosts;
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
 * Adding a request (delta values) to an Order
 * @deprecated
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
 * Adding a request (final values) to an Order
 */
exports.addRequestBySummary = function(req, res) {
	var findByItemId = function(source, itemId) {
  		for (var i = 0; i < source.length; i++) {
    		if (source[i].item == itemId) {
      			return i;
    		}
  		}
  		return -1;
	};

	var order   = req.order,
		newData = req.body,
		user    = req.user,
		request = {items: []},
		i;

	// TODO: Only groupbuy managers or Order user can add requests

	if (typeof newData === 'undefined' || typeof newData.items === 'undefined') {
		return res.status(400).send( errorHandler.prepareErrorResponse( new Error('Invalid data for order') ));
	}

	// Create request with delta to nullify the order
	for (i = 0; i < order.summary.length; i++) {
		request.items.push({ item: order.summary[i].item, quantity: -order.summary[i].quantity});
	}

	for (var j = 0; j < newData.items.length; j++) {
		i = findByItemId(request.items, newData.items[j].item);

		if (i === -1) {
			request.items.push(newData.items[j]);
		} else {
			request.items[i].quantity += newData.items[j].quantity;
		}
	}

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

	// Only platform admins can remove requests
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
 * Update payment data for an Order
 */
exports.updatePayment = function(req, res) {
	var order     = req.order,
	    groupbuy  = req.groupbuy,
		user      = req.user,
		isAdmin   = user.isAdmin(),
		isManager = (isAdmin || groupbuy.isManager(user._id) ),
		changedPayment = (req.body.paid === true) !== (order.payment.date !== null && order.payment.date !== undefined),
		paidDate       = (req.body.paid === true) ? Date.now() : null,
		payment        = {};

	if (isManager) {
		var changedReceived = (req.body.received === true) !== (order.payment.confirmationDate !== null && order.payment.confirmationDate !== undefined);

		payment.infoManagers = req.body.infoManagers;

		if (changedReceived) {
			payment.confirmationDate = (req.body.received === true) ? Date.now() : null;
			payment.confirmedBy = (req.body.received === true) ? req.user.id : null;
		}

		// I'm a manager but i am editing myself payment info
		if (user.id === order.user.id) {
			payment.info = req.body.info;
			if (changedPayment) {
				payment.date = paidDate;
			}
		}
	} else {
		payment.info = req.body.info;
		if (changedPayment) {
			payment.date = paidDate;
		}
	}

	payment = _.extend(order.payment , payment);

	// Saving it...
	order.update({ $set: {payment: payment}}, {}, function(err) {
		if (err) {
			return res.status(400).send({message: errorHandler.getErrorMessage(err) });
		} else {
			res.jsonp(payment);
		}
	});
};


/**
 * Update shipping data for an Order
 */
exports.updateShipping = function(req, res) {
	var order     = req.order,
	    groupbuy  = req.groupbuy,
		user      = req.user,
		isAdmin   = user.isAdmin(),
		isManager = (isAdmin || groupbuy.isManager(user._id) ),
		changedReceived = (req.body.received === true) !== (order.shipping.confirmationDate !== null),
		receivedDate    = (req.body.received === true) ? Date.now() : null,
		shipping        = {};

	if (isManager) {
		var changedShipped = (req.body.shipped === true) !== (order.shipping.date !== null);

		shipping.info = req.body.info;

		if (changedShipped) {
			shipping.date = (req.body.shipped === true) ? Date.now() : null;
			shipping.shippedBy = (req.body.shipped === true) ? req.user.id : null;
		}


		// I'm a manager but i am editing myself shipping info
		if (user.id === order.user.id) {
			shipping.address = req.body.address;
			if (changedReceived) {
				shipping.confirmationDate = receivedDate;
			}
		}
	} else {
		shipping.address = req.body.address;
		if (changedReceived) {
			shipping.confirmationDate = receivedDate;
		}
	}

	shipping = _.extend(order.shipping, shipping);
	// Saving it...
	order.update({ $set: {shipping: shipping}}, {}, function(err, order) {
		if (err) {
			return res.status(400).send({message: errorHandler.getErrorMessage(err) });
		} else {
			res.jsonp(order.shipping);
		}
	});
};



/**
 * Order middleware
 */
exports.orderByID = function(req, res, next, id) {
	Order.findById(id).populate('user', 'id username').populate('groupbuy').exec(function(err, order) {
		if (err) return res.status(400).send( errorHandler.prepareErrorResponse(err) );
		if (!order)
			return res.status(400).send( errorHandler.prepareErrorResponse( new Error('Failed to load Order ' + id) ));

		req.order = order;

		// Call Groupbuy middleware
		groupbuys.groupbuyByID(req, res, next, order.groupbuy);
	});
};
