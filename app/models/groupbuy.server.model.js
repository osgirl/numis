'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema	 = mongoose.Schema,
	slug	 = require('mongoose-slug-unique');

/**
 * Groupbuy Schema
 */
var GroupbuySchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Groupbuy name',
		trim: true
	},
	description: {
		type: String,
		default: '',
		required: 'Please fill Groupbuy description',
		trim: true
	},
	items: {
		type: String
	},
	managers: [{
		type: Schema.ObjectId,
		ref: 'User'
	}],
	members: [{
		type: Schema.ObjectId,
		ref: 'User'
	}],
	status: {
		type: String,
		enum: ['new', 'published', 'payments', 'paid', 'shipments', 'closed', 'cancelled', 'deleted'],
		default: 'new'
	},
	visibility: {

	},
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
		type: Date
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

//GroupbuySchema.plugin(slug('name'));


mongoose.model('Groupbuy', GroupbuySchema);
