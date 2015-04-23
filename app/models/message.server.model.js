'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Messaging Schema
 */
var MessageSchema = new Schema({
	groupbuy: {
		type: Schema.ObjectId,
		ref: 'Groupbuy',
		required: 'You must select a groupbuy.'
	},
	from: {
		type: Schema.ObjectId,
		ref: 'User',
		required: 'You must specify a sender.'
	},
	to: {
		type: Schema.ObjectId,
		ref: 'User'
	},
	text: {
		type: String,
		required: 'Please fill message text.',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	unread: {
		type: Boolean,
		default: true
	}
});


/**
 * Mark as read all member messages in a Groupbuy
 */
MessageSchema.statics.markAsRead = function(groupbuyId, userId, callback) {
	var query = { $and: [ {groupbuy: groupbuyId}, {to: userId} ] };

	this.update(query, { $set: {unread: false} }, { multi: true }).exec(callback);
};


mongoose.model('Message', MessageSchema);