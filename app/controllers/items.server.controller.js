'use strict';

/**
 * Module dependencies.
 */
var mongoose     = require('mongoose'),
	core         = require('./core.server.controller'),
	errorHandler = require('./errors.server.controller'),
	path         = require('path'),
	_            = require('lodash'),
	async        = require('async'),
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
		groupbuy = req.groupbuy,
		result = {};

	if (groupbuy && item && item._id) {
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
		result.currency = {
			_id: 	item.currency._id,
			name: 	item.currency.name,
			code: 	item.currency.code,
			symbol: item.currency.symbol
		};

		// Calculate price and local price for item in groupbuy
		result.prettyPrice = item.price + ' ' + item.currency.symbol;

		if (groupbuy.currencies.local.id !== groupbuy.currencies.provider.id) {
			result.localPrice = item.price * groupbuy.currencies.multiplier / groupbuy.currencies.exchangeRate;
			result.prettyLocalPrice = Math.ceil(100 * result.localPrice) / 100 + ' ' + groupbuy.currencies.local.symbol;
		} else {
			result.localPrice = result.price;
			result.prettyLocalPrice = result.prettyPrice;
		}

		// Add links to response
		result._links = {
			self: { href: selfURL },
			image: {
				href: selfURL + '/image',
				title: 'Item picture'
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

	// Adding count properties
	if ( options.numElems !== 'undefined' )   { result.numElems = options.numElems; }
	if ( options.totalElems !== 'undefined' ) { result.totalElems = options.totalElems; }

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

	// Set user creator
	item.user = req.user;
	item.groupbuy = req.groupbuy;

	item.save(function(err, item) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// Populate currency
			item.populate({path: 'currency', select: 'id name code symbol'}, function(err) {
				if (err) {
					return res.status(400).send( errorHandler.prepareErrorResponse (err) );
				}
				item.available = item.maxQuantity;

				res.status(201).jsonp( formattingItem(item, req) );
			});
		}
	});
};

/**
 * Show the current Item
 */
exports.read = function(req, res) {
	req.item.getAvailability(function(err, available) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		}
		req.item.available = available;
		res.jsonp( formattingItem(req.item, req) );
	});
};

/**
 * Update a Item
 */
exports.update = function(req, res) {
	var item = req.item ;

	delete req.body.user;
	item = _.extend(item , req.body);

	item.save(function(err, item) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			// Populate currency
			item.populate({path: 'currency', select: 'id name code symbol'}, function(err) {
				if (err) {
					return res.status(400).send( errorHandler.prepareErrorResponse (err) );
				}
				item.getAvailability(function(err, available) {
					if (err) {
						return res.status(400).send( errorHandler.prepareErrorResponse (err) );
					}
					item.available = available;
					res.jsonp( formattingItem(item, req) );
				});

			});
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
	var query  = req.query.filter || {},
		sort   = req.query.sort || 'title',
		limit  = req.query.limit || 25,
		page   = req.query.page || 1,
		fields = req.query.fields || {};

	// Filter items by groupbuy
	query.groupbuy = req.groupbuy;

	Item.paginate(query, page, limit, function(err, totalPages, items, count) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );

		} else {
			async.each(items,
			    function(item, callback) {
			        item.getAvailability(function(err, available) {
			            item.available = available;

			            callback();
			        });
			    },
			    function(err) {
			        if (err) {
			            return res.status(400).send( errorHandler.prepareErrorResponse (err) );
			        }
			        res.jsonp( formattingItemList(items, req, {page: page, totalPages: totalPages, numElems: items.length, totalElems: count, selFields: fields}) );
			    }
			);
		}
	}, { columns: fields, sortBy : sort, populate: 'currency' });
};



/**
 * Get item image
 */
exports.getImage = function(req, res) {
	// Init Variables
	var item = req.item,
		size = req.query.size,
		supportedSizes = ['sm', 'md', 'bg'],
		fileExt,
		fileName;

	if (supportedSizes.indexOf(size) === -1) {
		size = 'md';
	}

	if (item && item.image && item.image.path) {
		var options = {
			dotfiles: 'deny',
			lastModified: item.image.lastModified || false,
			headers: {
				'x-timestamp': Date.now(),
				'x-sent': true
			}
		};

		fileExt  = path.extname(item.image.path);
		fileName = path.dirname(item.image.path) + path.sep + path.basename(item.image.path, fileExt);

		fileName = fileName + '-' + size + fileExt;

		res.sendFile(fileName, options, function (err) {
			if (err) {
				res.status(err.status).end();
			}
		});
	} else {
		res.redirect('/modules/groupbuys/img/no-item-image-' + size + '.png');
	}


};

/**
 * Update item image
 */
exports.updateImage = function(req, res, next) {
	// Init Variables
	var item = req.item;

	if (!req.files || !req.files.file) {
		res.status(400).send({
			message: 'Has not received any picture'
		});

	} else {
		var file = req.files.file;

		// Generating necesary image attributes.
		file.type = file.mimetype;
		file.lastModifiedDate = Date.now();

		// Updating the user model
		item.set('image.file', file);
		item.updated = Date.now();

		// Saving it...
		item.update({ $set: {image: item.image, upated: item.updated}}, {}, function(err) {
			if (err) {
				return res.status(400).send({
					message: errorHandler.getErrorMessage(err)
				});
			} else {
				res.status(204).end();
			}
		});
	}

};

/**
* Delete user avatar
*/
exports.deleteImage = function(req, res) {
	// Init Variables
	var item = req.item;

	item.image = {};
	item.image.lastModified = Date.now();
	item.updated = Date.now();

	// Saving it...
	item.update({ $set: {image: item.image, upated: item.updated}}, {}, function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.status(204).end();
		}
	});
};





/**
 * Item middleware
 */
exports.itemByID = function(req, res, next, id) {
	Item.findById(id).populate('currency', 'id name code symbol').exec(function(err, item) {
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
	// TODO: Set a item access policies
	if (false && req.item.user.id !== req.user.id) {
		return res.status(403).send({
			name: 'NotAuthorized',
			message: 'User is not authorized'
		});
	}
	next();
};
