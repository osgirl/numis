'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Item = mongoose.model('Item'),
	_ = require('lodash');


/**
 * Formatting item details to send
 */
var formattingItem = exports.formattingItem = function(item, req, reduce) {
	reduce = reduce || false;

	var selfURL = '',
		parentURL = '',
		creatorURL = '',
		groupbuyURL = '',
		result = {};

	if (item && item._id) {
		try {
			var rels = item.relationsToLink(['user', 'groupbuy']);

			creatorURL  = '/api/v1' + rels.user;
			groupbuyURL = '/api/v1' + rels.groupbuy;
		} catch (ex) {}

		try {
			selfURL     = groupbuyURL + item.toLink();
			parentURL   = selfURL.replace(/\/[a-f\d]{24}$/i, '');
		} catch (ex) {}

		// Duplicate object item
		result = item.toJSON();

		// Add links to response
		result._links = {
			self: { href: selfURL },
			image: {
				href: selfURL + '/image{?size}',
				title: 'Item picture',
				templated: true
			}
		};

		if (!reduce) {
			try {
				result._links.creator = {
					href: creatorURL,
					title: 'User creator'
				};
				result._links.groupbuy = {
					href: groupbuyURL,
					title: 'Groupbuy to which belongs to'
				};
			} catch (ex) {}
		}

		// Remove fields
		delete result.__v;
		delete result.image;
		delete result.user;
		delete result.groupbuy;
	}

	return result;
};

/**
 * Formatting items list to send
 */
var formattingItemList = exports.formattingItemList = function(items, req) {
	var item;
	var result = {
		_links: {
			self: { href: req.url }
		},
		_embedded: {
			items: []
		}
	};

	for (var i = 0; i < items.length; i++) {
		result._embedded.items.push( formattingItem(items[i], req, true) );
	}

	// Send response
	return result;
};


/**
 * Create a Item
 */
exports.create = function(req, res) {
	var item  = new Item(req.body);

	item.user = req.user;

	item.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(201).jsonp( formattingItem(item, req) );
		}
	});
};

/**
 * Show the current Item
 */
exports.read = function(req, res) {
	res.jsonp( formattingItem(req.item, req) );
};

/**
 * Update a Item
 */
exports.update = function(req, res) {
	var item = req.item ;

	delete req.body.user;
	item = _.extend(item , req.body);

	item.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * Delete an Item
 */
exports.delete = function(req, res) {
	var item = req.item ;

	item.remove(function(err, item) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * List of Items
 */
exports.list = function(req, res) {
	Item.find().sort('title').exec(function(err, items) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingItemList(items, req) );
		}
	});
};


/**
 * Item middleware
 */
exports.itemByID = function(req, res, next, id) {
	Item.findById(id).exec(function(err, item) {
		if (err) return next(err);
		if (! item) return next(new Error('Failed to load Item ' + id));
		req.item = item ;
		next();
	});
};

/**
 * Item authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	// FIXME: Set a item acces policies
	if (false && req.item.user.id !== req.user.id) {
		return res.status(403).send({
			name: 'Unauthorized',
			message: 'User is not authorized'
		});
	}
	next();
};
