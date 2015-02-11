'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	crypto	 = require('crypto'),
	Schema   = mongoose.Schema;



var getPrice = function (num) {
	return (num / 100);
};

var setPrice = function (num) {
	return Math.round(num * 100);
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
			item: {
				type: Schema.ObjectId,
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
        get: getPrice,
        set: setPrice
	},
	shippingCost: {
		type: Number,
		min: [0, 'The shipping cost can not be negative.'],
        get: getPrice,
        set: setPrice
	},
	otherCosts: {
		type: Number,
		min: [0, 'The other costs can not be negative.'],
        get: getPrice,
        set: setPrice
	},
	total: {
		type: Number,
		min: [0, 'The total price can not be negative.'],
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


// TODO: Add validation to requests
/*
var many = [
	{ validator: validator, msg: 'uh oh' }
, { validator: anotherValidator, msg: 'failed' }
]
new Schema({ name: { type: String, validate: many }});

----

schema.path('name').validate(function (value, respond) {

----

toySchema.pre('validate', function (next) {
	if (this.name != 'Woody') this.name = 'Woody';
	next();
})

*/


/**
 * Hook a pre save method to update timestamp
 */
OrderSchema.pre('save', function (next) {
	var now = new Date();

	if (!this.created) {
		this.created = now;
	} else {
		this.updated = now;
	}
	next();
});


/**
 * Create instance method for adding new request
 */
OrderSchema.methods.addRequest = function(request, user, callback) {
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

	// Re-calculate summary and subtotal
	if (this.summary && this.summary.length > 0) {
		this.calculateSummary();
	}

	// Do callback
	if (typeof callback !== 'undefined') {
		callback();
	}
};

/**
* Create instance method for removing a request
*/
OrderSchema.methods.removeRequest = function(id, callback) {
	// Remove the request from requests list
	this.requests.pull(id);

	// Re-calculate summary and subtotal
	if (this.summary && this.summary.length > 0) {
		this.calculateSummary();
	}

	// Do callback
	if (typeof callback !== 'undefined') {
		callback();
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
		_this.summary.push( {item: key, quantity: this[key]} );
	}, aItems);


	// TODO: Calculate subtotal

	// Do callback
	if (typeof callback !== 'undefined') {
		callback();
	}
};

// Compile a 'Order' model using the OrderSchema as the structure.
// Mongoose also creates a MongoDB collection called 'users' for these documents.
//
// Notice that the 'Order' model is capitalized, this is because when a model is compiled,
// the result is a constructor function that is used to create instances of the model.
// The instances created from the model constructor are documents which will be persisted
// by Mongo.
mongoose.model('Order', OrderSchema);