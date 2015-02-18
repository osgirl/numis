'use strict';

/**
 * Module dependencies.
 */
var mongoose   = require('mongoose'),
	slugPlugin = require('mongoose-url-slugs'),
	l2rPlugin  = require('mongoose-l2r'),
	Schema	   = mongoose.Schema;

/**
 * Groupbuy Schema
 */
var GroupbuySchema = new Schema({
	title: {
		type: String,
		default: '',
		required: 'Please fill Groupbuy title',
		trim: true,
		match: [/.{10,80}/, 'Title must be between 10 and 80 characters.']
	},
	description: {
		type: String,
		default: '',
		required: 'Please fill Groupbuy description',
		trim: true
	},
	items: [{
		type: Schema.ObjectId,
		ref: 'Item'
	}],
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
		items: {
			type: String,
			enum: ['public'],
			default: 'public'
		},
		managers: {
			type: String,
			enum: ['public'],
			default: 'public'
		},
		members: {
			type: String,
			enum: ['private', 'restricted', 'public'],
			default: 'public'
		},
		itemNumbers: {
			type: String,
			enum: ['public'],
			default: 'public'
		},
		itemsByMember: {
			type: String,
			enum: ['private', 'restricted', 'public'],
			default: 'restricted'
		},
		paymentStatus: {
			type: String,
			enum: ['private', 'restricted', 'public'],
			default: 'restricted'
		},
		shipmentsState: {
			type: String,
			enum: ['private', 'restricted'],
			default: 'restricted'
		}
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


/**
 * Add plugins to Groupbuy schema.
 */
// Slug plugin
GroupbuySchema.plugin(slugPlugin('title', {field: 'name'}));

// L2r plugin
GroupbuySchema.plugin(l2rPlugin);


/**
 * Hook a pre save method to modify udpated date.
 */
GroupbuySchema.pre('save', function(next) {
	if (this._id) {
		this.updated = new Date();
	}

	next();
});


mongoose.model('Groupbuy', GroupbuySchema);
