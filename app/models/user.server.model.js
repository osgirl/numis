'use strict';

/**
 * Module dependencies.
 */
var mongoose       = require('mongoose'),
	slugPlugin     = require('mongoose-url-slugs'),
	filePlugin     = require('mongoose-file').filePlugin,
	paginatePlugin = require('mongoose-paginate'),
	l2rPlugin      = require('mongoose-l2r'),
	crypto	       = require('crypto'),
	path           = require('path'),
	lwip           = require('lwip'),
	Schema 	       = mongoose.Schema;

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function(property) {
	return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function(password) {
	return (this.provider !== 'local' || (password && password.length >= 8));
};


var makeUploadToModel = function(basedir, subdir) {
	var b_dir, s_dir, upload_to_model;

	b_dir = basedir;
    s_dir = subdir;

	upload_to_model = function(fileObj) {
      	var dstdir, id;

		dstdir = b_dir;
      	if (s_dir) {
			dstdir = path.join(dstdir, s_dir);
      	}
      	id = this.get('id');
      	if (id) {
			dstdir = path.join(dstdir, id + '.' + fileObj.extension.toLowerCase());
		} else {
			dstdir = path.join(dstdir, fileObj.name);
		}
      	return dstdir;
    };
    return upload_to_model;
};


var generateAvatarImages = function(pathname, imgFile, oldValue) {
	var fileExt  = path.extname(imgFile),
		fileName = path.dirname(imgFile) + path.sep + path.basename(imgFile, fileExt);

	var generate_image = function(srcFile, dstFile, resizeSize, callback) {
		lwip.open(srcFile, function(err, image) {
			if (err) throw err;

			// Crop to make a square image
			var cropSize = (image.width() > image.height() ) ? image.height() : image.width();

			image.batch()
				.crop(cropSize, cropSize)
				.resize(resizeSize, resizeSize)
				.writeFile(dstFile, function(err) {
					if (callback && typeof callback === 'function') {
						callback(err);
					} else {
						if (err) throw err;
					}
				});
		});
	};

	// Crop and resize the image into supported sizes
	generate_image(imgFile, fileName + '-bg' + fileExt, 256, function(err) {
		generate_image(imgFile, fileName + '-md' + fileExt, 128, function(err) {
			generate_image(imgFile, fileName + '-sm' + fileExt, 48, function(err) {
				if (err) throw err;
			});
		});
	});
};



/**
 * Creates a new Person.
 * @class Person
 */

/**
 * User Schema
 */
var UserSchema = new Schema({
	firstName: {
		type: String,
		trim: true,
		default: '',
		validate: [validateLocalStrategyProperty, 'Please fill in your first name']
	},
	lastName: {
		type: String,
		trim: true,
		default: '',
		validate: [validateLocalStrategyProperty, 'Please fill in your last name']
	},
	displayName: {
		type: String,
		trim: true
	},
	email: {
		type: String,
		trim: true,
		default: '',
		validate: [validateLocalStrategyProperty, 'Please fill in your email'],
		match: [/.+\@.+\..+/, 'Please fill a valid email address']
	},
	username: {
		type: String,
		unique: 'Username is not available. Please select another one.',
		required: 'Please fill in a username',
		trim: true
	},
	homeAddress: {
		type: String,
		trim: true
	},
	password: {
		type: String,
		default: '',
		validate: [validateLocalStrategyPassword, 'Password should be longer'],
	},
	salt: {
		type: String,
	},
	provider: {
		type: String,
		required: 'Provider is required'
	},
	providerData: {
		select: false
	},
	additionalProvidersData: {
		select: false
	},
	roles: {
		type: [{
			type: String,
			enum: ['user', 'premium', 'admin']
		}],
		default: ['user'],
		select: true
	},
	updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
	},
	/* For reset password */
	resetPasswordToken: {
		type: String,
		select: false
	},
	resetPasswordExpires: {
		type: Date,
		select: false
	}
});


/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function(next) {
	if (this.password && this.password.length > 6) {
		this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
		this.password = this.hashPassword(this.password);
	}

	next();
});

/**
* Hook a pre save method to modify udpated date.
*/
UserSchema.pre('save', function(next) {
	if (this._id) {
		this.updated = new Date();
	}

	next();
});

/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function(password) {
	if (this.salt && password) {
		return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
	} else {
		return password;
	}
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(password) {
	return this.password === this.hashPassword(password);
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
	var _this = this;
	var possibleUsername = username + (suffix || '');

	_this.findOne({
		username: possibleUsername
	}, function(err, user) {
		if (!err) {
			if (!user) {
				callback(possibleUsername);
			} else {
				return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
			}
		} else {
			callback(null);
		}
	});
};

/**
 * Create instance method for check if an user is platform admin
 */
UserSchema.methods.isAdmin = function() {
	return (this.roles.indexOf('admin') !== -1);
};


/**
 * Add plugins to User schema.
 */
// Slug plugin
UserSchema.plugin(slugPlugin('username', {field: 'name'}));

// Paginate plugin
UserSchema.plugin(paginatePlugin);

// L2r plugin
UserSchema.plugin(l2rPlugin);

// file plugin
var uploads_base = path.join(__dirname, '../../'),
	uploads 	 = path.join(uploads_base, 'uploads');

UserSchema.plugin(filePlugin, {
	name:        'avatar',
	change_cb:   generateAvatarImages,
	upload_to:   makeUploadToModel(uploads, 'avatars'),
	relative_to: uploads_base
});



// Compile a 'User' model using the UserSchema as the structure.
// Mongoose also creates a MongoDB collection called 'users' for these documents.
//
// Notice that the 'User' model is capitalized, this is because when a model is compiled,
// the result is a constructor function that is used to create instances of the model.
// The instances created from the model constructor are documents which will be persisted
// by Mongo.
mongoose.model('User', UserSchema);
