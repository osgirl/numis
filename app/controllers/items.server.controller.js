'use strict';

/**
 * Module dependencies.
 */
var mongoose     = require('mongoose'),
	core         = require('./core.server.controller'),
	errorHandler = require('./errors.server.controller'),
	_            = require('lodash'),
	Item         = mongoose.model('Item');


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
var formattingItemList = exports.formattingItemList = function(items, req, options) {
	var selfURL = (typeof req.url !== 'undefined') ? req.url : '';

	var result = {
		_links: {
			self: { href: selfURL }
		},
		_embedded: {
			items: []
		}
	};

	// Adding paggination links to result collection
	result._links = _.assign(result._links, core.addPaginationLinks(selfURL, options) );

	// Adding embedded items
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
	var query  = req.query.filter || null,
		sort   = req.query.sort || 'title',
		limit  = req.query.limit || 25,
		page   = req.query.page || 1,
		fields = req.query.fields || {};

	Item.paginate(query, page, limit, function(err, totalPages, items, count) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.jsonp( formattingItemList(items, req, {page: page, totalPages: totalPages, numElems: limit, totalElems: count, selFields: fields}) );
		}
	}, { columns: fields, sortBy : sort });
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
