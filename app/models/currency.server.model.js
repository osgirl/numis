'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Currency Schema
 */
var CurrencySchema = new Schema({
	name: {
		type: String,
		required: 'Please fill Currency name',
		unique: true,
		trim: true
	},
	code: {
		type: String,
		required: 'Please fill Currency code.',
		unique: true,
		trim: true
	},
	symbol: {
		type: String,
		required: 'Please fill Currency symbol.',
		trim: true
	},
	enabled: {
		type: Boolean,
		default: true
	},
	priority: {
		type: Number,
		min: 0,
		max: 100,
		default: 0
	}
});


/**
 * Add validators to Currency schema.
 */
CurrencySchema.path('code').validate( function (value) {
    return value.length === 3;
}, 'Currency code must containt 3 characters.');


/**
 * Get default currency
 */
CurrencySchema.statics.getDefault = function(callback) {
	this.find({enabled: true})
		.sort('-priority name')
		.select('id name code symbol')
		.limit(1)
		.exec(function(err, currencies) {
			if (err) {
				console.error (err);
			} else {
				var result = (currencies.length > 0) ? currencies[0] : null;
				
				if (callback) {
					callback(err, result);
				} else {
					return result;
				}
			}
		});
};


mongoose.model('Currency', CurrencySchema);