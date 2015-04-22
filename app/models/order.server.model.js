'use strict';

/**
 * Module dependencies.
 */
var mongoose       = require('mongoose'),
	crypto         = require('crypto'),
	paginatePlugin = require('mongoose-paginate'),
	l2rPlugin      = require('mongoose-l2r'),
	_              = require('lodash'),
	async          = require('async'),
	Schema         = mongoose.Schema;



var getPrice = function (num) {
	return (num / 100);
};

var setPrice = function (num) {
	return Math.round(num * 100);
};

/**
 * Function to calculate subtotal and total prices of an order
 */
var calculatePrices = function(order, callback) {
	var subtotal = 0;

	// Set default values for subtotal and total
	order.subtotal = 0;
	order.total    = 0;

	// Populate summary items and groupbuy currencies.
	order.populate([
		{path: 'groupbuy', select: 'currencies', model: 'Groupbuy'},
		{path: 'summary.item', select: 'price currency', model: 'Item'}
	], function (err) {
		if (err) {
			return callback(err);
		}

		try {
			// Calculate subtotal in provider currency
			for (var i = 0; i < order.summary.length; i++) {
				if (order.summary[i].item.currency.id === order.groupbuy.currencies.provider.id) {
					subtotal += order.summary[i].item.price * order.summary[i].quantity;
				} else {
					subtotal = NaN;
				}
			}

			if (!isNaN(subtotal) ) {
				// Calculate subtotal in local currency
				if (order.groupbuy.currencies.local !== order.groupbuy.currencies.provider) {
					subtotal = (subtotal / order.groupbuy.currencies.exchangeRate * order.groupbuy.currencies.multiplier);
				}
				// Set values to document.
				order.subtotal = subtotal;
				order.total = order.subtotal + order.shippingCost + order.otherCosts;
			}
			callback();

		} catch (ex) {
			order.subtotal = 0;
			order.total    = 0;

			callback(err);
		}

	});

};

/**
 * Order Schema
 */
var OrderSchema = new Schema({
	groupbuy: {
		type: Schema.ObjectId,
		ref: 'Groupbuy',
		required: 'You must select a groupbuy.'
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User',
		required: 'You must select a buyer.'
	},
	requests: [{
		user: {
			type: Schema.ObjectId,
			ref: 'User',
			required: 'You must select a groupbuy.'
		},
		items: [{
			_id: false,
			item: {
				type: Schema.Types.ObjectId,
				ref: 'Item',
				required: 'You must select a item.'
			},
			quantity: {
				type: Number,
				required: true
			}
		}],
		requestDate: {
			type: Date,
			required: 'Request date is not definethis.'
		}
	}],
	summary: [{
		_id: false,
		item: {
			type: Schema.ObjectId,
			ref: 'Item',
			required: true
		},
		quantity: {
			type: Number,
			min: [0, 'The quantity can not be negative.'],
			required: true
		}
	}],
	subtotal: {
		type: Number,
		min: [0, 'The subtotal price can not be negative.'],
		default: 0,
        get: getPrice,
        set: setPrice
	},
	providerShippingCost: {
		type: Number,
		min: [0, 'The provider shipping cost can not be negative.'],
		default: 0,
        get: getPrice,
        set: setPrice
	},
	shippingCost: {
		type: Number,
		min: [0, 'The shipping cost can not be negative.'],
		default: 0,
        get: getPrice,
        set: setPrice
	},
	otherCosts: {
		type: Number,
		min: [0, 'The other costs can not be negative.'],
		default: 0,
        get: getPrice,
        set: setPrice
	},
	total: {
		type: Number,
		min: [0, 'The total price can not be negative.'],
		default: 0,
        get: getPrice,
        set: setPrice
	},
	payment: {
	    _id: false,
	    date: {
	        type: Date
	    },
	    info: {
	        type: String,
	        default: '',
	        trim: true
	    },
		infoManagers: {
	        type: String,
	        default: '',
	        trim: true
	    },
	    confirmedBy: {
	        type: Schema.ObjectId,
	        ref: 'User'
	    },
	    confirmationDate: {
	        type: Date
	    }
	},
	shipping: {
	    _id: false,
	    address: {
	        type: String,
	        default: '',
	        trim: true
	    },
	    date: {
	        type: Date
	    },
	    shippedBy: {
	        type: Schema.ObjectId,
	        ref: 'User'
	    },
	    info: {
	        type: String,
	        default: '',
	        trim: true
	    },
	    confirmationDate: {
	        type: Date
	    }
	},
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
		type: Date
	},
});


/**
 * Hook a pre save method to check that the user haven't another Order in the same groupbuy
 */
OrderSchema.pre('save', function(next) {
	this.constructor.count({groupbuy: this.groupbuy, user: this.user, _id: {$ne: this.id} }, function(err, count) {
		if (err)
			next(err);
		else if (count > 0)
			next( new Error('The user already have a order for this groupbuy.') );
		else
			next();
	});
});

/**
 * Hook a pre save method to re-calculate summary and subtotal.
 */
OrderSchema.pre('save', function(next) {
	calculatePrices(this, next);
});

/**
 * Hook a pre save method to modify udpated date.
 */
OrderSchema.pre('save', function(next) {
	if (this._id) {
		this.updated = new Date();
	}

	next();
});



/*
 *
 */
var validateRequest = function(request, callback) {
	var Item = mongoose.model('Item');

	async.each(request.items,
		function(elem, callback) {
			if (typeof elem.quantity !== 'number') {
				callback (new Error ('The quantity of the element request is invalid.') );
			}

			Item.getAvailability(elem.item, function(err, available) {
				if (available !== '' && elem.quantity > available) {
					callback ( new Error ('There isn\'t enough products to satisfy the request.') );

				} else {
					callback();
				}
			});
		},
		function(err) {
			callback(err);
		});
};


/**
 * Create instance method for adding new request
 */
OrderSchema.methods.addRequest = function(request, user, callback) {
	var _this = this;

	// Set the request date
	request.requestDate = new Date();
	// If user is specified, set this user. Otherwise, set the order user as request user.
	request.user = (user && typeof user !== 'undefined') ? user: this.user;

	// Check the availability of the requested items.
	validateRequest(request, function(err) {
		if (err) {
			callback(err);
		} else {
			// Add the request to requests list in the order
			if (_this.requests && _this.requests.length > 0) {
				_this.requests.push(request);
			} else {
				_this.requests = request;
			}

			_this.calculateSummary(callback);
		}
	});

};

/**
 * Create instance method for removing a request
 */
OrderSchema.methods.removeRequest = function(id, callback) {
	var _this = this;

	// Remove the request from requests list
	this.requests.pull(id);

	this.calculateSummary(callback);
};

/**
 * Create instance method for calculate summary from requests
 */
OrderSchema.methods.calculateSummary = function(callback) {
	var aItems = [],
		_this = this,
		selItem,
		i, j, key;

	// Grouping items from many requests
	for (i = 0; i < this.requests.length; i++) {
		for (j = 0; j < this.requests[i].items.length; j++) {
			selItem = this.requests[i].items[j];

			if (typeof aItems[ selItem.item ] === 'undefined') {
				aItems[ selItem.item ] = selItem.quantity;
			} else {
				aItems[ selItem.item ] += selItem.quantity;
	    	}
		}
	}

	// Clean previous summary
	this.summary = [];

	// Fill calculated data in summary field
	Object.keys(aItems).forEach( function(key) {
		// Avoid negative quantities in summary.
		if (this[key] < 0) {
			this[key] = 0;
		}
		_this.summary.push( {item: key, quantity: this[key]} );
	}, aItems);

	this.save(callback);
};


/**
 * Add plugins to Order schema.
 */
// Paginate plugin
OrderSchema.plugin(paginatePlugin);

// L2r plugin
OrderSchema.plugin(l2rPlugin);


OrderSchema.set('toJSON', { getters: true, virtuals: false });
OrderSchema.set('toObject', { getters: true, virtuals: false });


// Compile a 'Order' model using the OrderSchema as the structure.
// Mongoose also creates a MongoDB collection called 'orders' for these documents.
//
// Notice that the 'Order' model is capitalized, this is because when a model is compiled,
// the result is a constructor function that is used to create instances of the model.
// The instances created from the model constructor are documents which will be persisted
// by Mongo.
mongoose.model('Order', OrderSchema);