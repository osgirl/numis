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


/**
 * Instance method for adding an user as a member
 */
GroupbuySchema.methods.addMember = function(userId, callback) {
	if (!this.isMember(userId) ) {
		this.members.push(userId);

		this.save(callback);
	}
};

/**
 * Instance method for adding an user as a manager
 */
GroupbuySchema.methods.addManager = function(userId, callback) {
	if (!this.isManager(userId) ) {
		this.managers.push(userId);

		if (!this.isMember(userId) ) {
			this.members.push(userId);
		}

		this.save(callback);
	}
};

/**
 * Instance method for check if an user is member
 */
GroupbuySchema.methods.isMember = function(userId) {
	return (this.members && typeof this.members !== 'undefined' && this.members.indexOf(userId) !== -1);
};


/**
 * Instance method for check if an user is manager
 */
GroupbuySchema.methods.isManager = function(userId) {
	return (this.managers && typeof this.managers !== 'undefined' && this.managers.indexOf(userId) !== -1);
};


/**
 * Instance method for get user roles in the groupbuy
 */
GroupbuySchema.methods.getRoles = function(user) {
	var roles = [];

	if (user.isAdmin() || this.isManager(user.id) ) {
		roles = ['manager', 'member'];
	} else if (this.isMember(user.id) ) {
		roles = ['member'];
	}

	return roles;
};

/**
 * Instance method for check permissions on the groupbuy
 */
GroupbuySchema.methods.checkVisibility = function(user, property) {
	if (user.isAdmin()) {
		return true;
	} else {
		return (this.visibility[property] === 'public' || 
				this.visibility[property] === 'restricted' && this.isMember(user.id) || 
				this.visibility[property] === 'private' && this.isManager(user.id)
		);
	}
};


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


// Compile a 'Groupbuy' model using the GroupbuySchema as the structure.
// Mongoose also creates a MongoDB collection called 'groupbuys' for these documents.
//
// Notice that the 'Groupbuy' model is capitalized, this is because when a model is compiled,
// the result is a constructor function that is used to create instances of the model.
// The instances created from the model constructor are documents which will be persisted
// by Mongo.
mongoose.model('Groupbuy', GroupbuySchema);
