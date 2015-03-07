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

mongoose.model('Currency', CurrencySchema);