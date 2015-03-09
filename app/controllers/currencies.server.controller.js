'use strict';

/**
 * Module dependencies.
 */
var mongoose     = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Currency     = mongoose.model('Currency');

/**
 * Formatting currency details to send
 */
var formattingCurrency = function(currency, req) {
	var selfURL   = (typeof req.url !== 'undefined') ? req.url : '',
		parentURL = '',
		result    = {};

	if (currency && currency._id) {
		parentURL   = selfURL.replace(/\/[a-f\d]{24}$/i, '');

		// Duplicate object item
		result = currency.toJSON();

		// Add links to response
		result._links = {
			self:       { href: selfURL },
			collection: { href: parentURL, title: 'Currencies list' },
			default:    { href: parentURL + 'default', title: 'Default currency' }
		};

		// Remove fields
		delete result.__v;
		delete result.priority;
		delete result.enabled;
	}

	return result;
};

/**
 * Formatting items list to send
 */
var formattingCurrencyList = function(currencies, req) {
	var selfURL = (typeof req.url !== 'undefined') ? req.url : '';

	var result = {
		_links: {
			self:    { href: selfURL },
			default: { href: selfURL + 'default', title: 'Default currency' }
		},
		_embedded: {
			currencies: currencies
		}
	};

	// Send response
	return result;
};



/**
 * Show the current Currency
 */
exports.read = function(req, res) {
	res.jsonp( formattingCurrency(req.currency, req) );
};


/**
 * List of Currencies
 */
exports.list = function(req, res) {
	Currency.find({enabled: true}).sort('-priority name').select('id name code symbol').exec(function(err, currencies) {
		if (err) {
			return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
		} else {
			res.jsonp( formattingCurrencyList(currencies, req) );
		}
	});
};


/**
 * Default Currency
 */
exports.getDefault = function(req, res) {
	Currency.getDefault( function(err, currency) {
		if (err) {
			return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
		} else {
			res.jsonp( formattingCurrency(currency, req) );
		}
	});
};

/**
 * Currency middleware
 */
exports.currencyByID = function(req, res, next, id) {
	Currency.findById(id).exec(function(err, currency) {
		if (err) return next(err);
		if (! currency) return next(new Error('Failed to load Currency ' + id));
		req.currency = currency ;
		next();
	});
};
