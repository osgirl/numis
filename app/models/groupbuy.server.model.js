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
			enum: ['private', 'restricted', 'public'],
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

GroupbuySchema.plugin(slug('name'));


/**
* Hook a pre save method to add to members an managers the creator user
*/
GroupbuySchema.pre('save', function(next) {
	if (this.user) {
		if (this.members.indexOf(this.user) === -1) {
			this.members.push(this.user);
		}
		if (this.managers.indexOf(this.user) === -1) {
			this.managers.push(this.user);
		}
	}

	next();
});


mongoose.model('Groupbuy', GroupbuySchema);
