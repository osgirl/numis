'use strict';

/**
 * Module dependencies.
 */
var mongoose  = require('mongoose'),
	crypto	  = require('crypto'),
	l2rPlugin = require('mongoose-l2r'),
	_         = require('lodash'),
	Schema    = mongoose.Schema;



var getPrice = function (num) {
	return (num / 100);
};

var setPrice = function (num) {
	return Math.round(num * 100);
};

/**
 * Function to calculate subtotal and total prices of an order
 */
var calculatePrices = function(order) {
	var subtotals = {},
		summaryGrp;

	if (order.summary && order.summary.length > 0) {
		// Populate summary items
		order.populate({path: 'summary.item', select: 'price currency', model: 'Item'}, function (err) {
			if (err) {
				if (callback && typeof(callback) === 'function') {
					callback(err);
				}
			} else {
				// Group item by currencies
				summaryGrp = _.groupBy(order.summary, function (entry) {
					return entry.item.currency.code;
				});

				// Calculate subtotal price in each currencies.
				_.forEach(summaryGrp, function(elems, key) {
					subtotals[key] = _.reduce(elems, function(sum, elem) {
						return sum + elem.item.price * elem.quantity;
					}, 0);
				});

				//console.log('Subtotals:', subtotals);

// TODO: Change to support multiple currencies
				order.subtotal = _.reduce(subtotals, function(sum, n) { return sum + n; });
				order.total = order.subtotal + order.shippingCost + order.otherCosts;

				//console.log('Subtotal:', order.subtotal, ' - total:', order.total);
			}
		});

	} else {
		order.subtotal = 0;
		order.total = order.subtotal + order.shippingCost + order.otherCosts;

		//console.log('Subtotal:', order.subtotal, ' - total:', order.total);
	}
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
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
		type: Date
	},
});


/**
 * Hook a pre save method to re-calculate summary and subtotal.
 */
OrderSchema.pre('save', function(next) {
	if (this.summary && this.summary.length > 0) {
		calculatePrices(this);
	}

	next();
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


/**
 * Create instance method for adding new request
 */
OrderSchema.methods.addRequest = function(request, user, callback) {
	var _this = this;

	// Set the request date
	request.requestDate = new Date();

	// If user is specified, set this user. Otherwise, set the order user as request user.
	request.user = (user && typeof user !== 'undefined') ? user: this.user;

	// Add the request to requests list in the order
	if (this.requests && this.requests.length > 0) {
		this.requests.push(request);
	} else {
		this.requests = request;
	}

	if (this.summary && this.summary.length > 0) {
		this.calculateSummary(callback);
	} else {
		this.save(callback);
	}
};

/**
 * Create instance method for removing a request
 */
OrderSchema.methods.removeRequest = function(id, callback) {
	var _this = this;

	// Remove the request from requests list
	this.requests.pull(id);

	if (this.summary && this.summary.length > 0) {
		this.calculateSummary(callback);
	} else {
		this.save(callback);
	}
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
 * Add plugins to Item schema.
 */
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