'use strict';

/**
 * Module dependencies.
 */
var mongoose       = require('mongoose'),
	slugPlugin     = require('mongoose-url-slugs'),
	paginatePlugin = require('mongoose-paginate'),
	l2rPlugin      = require('mongoose-l2r'),
	Schema         = mongoose.Schema,
	Currency       = mongoose.model('Currency');


var getExchangeRate = function (num) {
    return (num / 1000000);
};


var setExchangeRate = function (num) {
    return Math.round(num * 1000000);
};


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
	currencies: {
		_id: false,
		local: {
			type: Schema.ObjectId,
	        ref: 'Currency',
	        required: 'You must specify the local/manager currency.'
		},
		provider: {
			type: Schema.ObjectId,
	        ref: 'Currency',
			required: 'You must specify the provider/items currency.'
		},
		exchangeRate: {
			type: Number,
			min: [0, 'The exchange rate can not be negative.'],
			default: 1,
	        get: getExchangeRate,
	        set: setExchangeRate
		},
		multiplier: {
			type: Number,
			default: 1
		}
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
 * Hook a pre validate method to set the default currency as local currency if not provided.
 */
GroupbuySchema.pre('validate', function(next) {
	var _this = this;

	if (!this.currencies.local) {
		Currency.getDefault( function(err, currency) {
			if (!err && currency) {
				if (typeof _this.currencies === 'undefined') {
					_this.currencies = {
						local:    currency._id,
						provider: currency._id
					};
				} else {
					_this.currencies.local = currency._id;
				}
			}

			next();
		});
	} else {
		next();
	}
});


/**
 * Hook a pre validate method to set the provider currency as same as local currency if not provided.
 */
GroupbuySchema.pre('validate', function(next) {
	var _this = this;

	if (!this.currencies.provider && this.currencies.local) {
		this.currencies.provider = this.currencies.local;
		this.currencies.exchangeRate = 1.0000;
		this.currencies.multiplier = 1.0;
	}
	next();
});


/**
 * Hook a pre save method to add user creator as manager if there are not managers.
 */
GroupbuySchema.pre('save', function(next) {
	if (this.managers.length === 0) {
		if (!this.isManager(this.user) ) {
			this.managers.push(this.user);

			if (!this.isMember(this.user) ) {
				this.members.push(this.user);
			}
		}
	}

	next();
});


/**
 * Hook a pre save method to modify udpated date.
 */
GroupbuySchema.pre('save', function(next) {
	if (this._id) {
		this.updated = new Date();
	}

	next();
});



/**
 * Add plugins to Groupbuy schema.
 */
// Slug plugin
GroupbuySchema.plugin(slugPlugin('title', {field: 'name'}));

// Paginate plugin
GroupbuySchema.plugin(paginatePlugin);

// L2r plugin
GroupbuySchema.plugin(l2rPlugin);



// Compile a 'Groupbuy' model using the GroupbuySchema as the structure.
// Mongoose also creates a MongoDB collection called 'groupbuys' for these documents.
//
// Notice that the 'Groupbuy' model is capitalized, this is because when a model is compiled,
// the result is a constructor function that is used to create instances of the model.
// The instances created from the model constructor are documents which will be persisted
// by Mongo.
mongoose.model('Groupbuy', GroupbuySchema);
