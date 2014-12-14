'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	slug	 = require('mongoose-url-slugs'),
	Schema	 = mongoose.Schema;

/**
 * Groupbuy Schema
 */
var GroupbuySchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Groupbuy name',
		trim: true,
		match: [/.{10,80}/, 'Name must be between 10 and 80 characters.']
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
	updates: [{
		publishDate: {
			type: Date
		},
		textInfo: {
			type: String
		}
	}],
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

GroupbuySchema.plugin(slug('name'));


mongoose.model('Groupbuy', GroupbuySchema);
