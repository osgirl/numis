'use strict';

/**
 * Module dependencies.
 */
var mongoose       = require('mongoose'),
	slugPlugin     = require('mongoose-url-slugs'),
	filePluginLib  = require('mongoose-file'),
	filePlugin     = filePluginLib.filePlugin,
	paginatePlugin = require('mongoose-paginate'),
	l2rPlugin      = require('mongoose-l2r'),
	path           = require('path'),
	lwip           = require('lwip'),
	Schema         = mongoose.Schema;


var getPrice = function (num) {
    return (num / 100);
};


var setPrice = function (num) {
    return Math.round(num * 100);
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


var generateItemImages = function(pathname, imgFile, oldValue) {
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
			generate_image(imgFile, fileName + '-sm' + fileExt, 64, function(err) {
				if (err) throw err;
			});
		});
	});
};



/**
 * Item Schema
 */
var ItemSchema = new Schema({
	title: {
		type: String,
		default: '',
		required: 'Please fill Item title',
		trim: true
	},
    description: {
        type: String,
        default: '',
        required: 'Please fill Item description',
        trim: true
    },
	maxQuantity: {
		type: Number,
		min: [0, 'The maximum amount can not be negative. Specify 0 for no set maximum amount']
	},
	price: {
		type: Number,
		min: [0, 'The price can not be less than ({MIN}).'],
		required: 'Please fill Item price',
        get: getPrice,
        set: setPrice
	},
	currency: {
        code: {
            type: String,
            default: 'EUR',
            required: 'Please select currency.',
            trim: true
        },
        symbol: {
		    type: String,
		    default: '€',
		    required: 'Please select currency.',
		    trim: true
        }
	},
	updated: {
		type: Date
	},
	created: {
		type: Date,
		default: Date.now
	},
    groupbuy: {
        type: Schema.ObjectId,
        ref: 'Groupbuy',
        required: 'You must specify the groupbuy'
    },
	user: {
		type: Schema.ObjectId,
		ref: 'User',
		required: 'You must specify the user creator'
	}
});


/**
 * Add validators to Item schema.
 */
ItemSchema.path('currency.code').validate( function (value) {
    return value.length === 3;
}, 'Currency code must containt 3 characters.');


/**
 * Hook a pre save method to modify udpated date.
 */
ItemSchema.pre('save', function(next) {
	if (this._id) {
		this.updated = new Date();
	}

	next();
});


/**
 * Add plugins to Item schema.
 */
// Slug plugin
ItemSchema.plugin(slugPlugin('title', {field: 'name'}));

// Paginate plugin
ItemSchema.plugin(paginatePlugin);

// L2r plugin
ItemSchema.plugin(l2rPlugin);

// file plugin
var uploads_base = path.join(__dirname, '../../'),
	uploads 	 = path.join(uploads_base, 'uploads');

ItemSchema.plugin(filePlugin, {
	name:        'image',
	change_cb:   generateItemImages,
	upload_to:   makeUploadToModel(uploads, 'items'),
	relative_to: uploads_base
});


ItemSchema.set('toJSON', { getters: true, virtuals: false });
ItemSchema.set('toObject', { getters: true, virtuals: false });


// Compile a 'Item' model using the ItemSchema as the structure.
// Mongoose also creates a MongoDB collection called 'items' for these documents.
//
// Notice that the 'Item' model is capitalized, this is because when a model is compiled,
// the result is a constructor function that is used to create instances of the model.
// The instances created from the model constructor are documents which will be persisted
// by Mongo.
mongoose.model('Item', ItemSchema);