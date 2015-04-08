'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');


/*
 * Replade or add page param to an URL
 */
var createURLPage = function(selfURL, pageParam, pageNum) {
	pageParam = pageParam || 'page';
	pageNum   = pageNum || 1;

	var re        = new RegExp('\(\\?|&\)' + pageParam + '=\\d+', 'i'),
		doReplace = selfURL.match(re),
		hasParams = (selfURL.indexOf('?') !== -1),
		url;

	if (doReplace) {
		url = {href: selfURL.replace(re, '$1' + pageParam +'='+ pageNum) };
	} else {
		url = {href: selfURL + (hasParams? '&' : '?') + pageParam +'='+ pageNum };
	}

	return url;
};

/*
 * Add links to navigation in response
 */
var addPaginationLinks = exports.addPaginationLinks = function(selfURL, options) {
	var result = {};

	if (typeof selfURL !== 'undefined' && typeof options.totalPages !== 'undefined' &&
		typeof options.page !== 'undefined' && options.totalPages > 1) {

		var pageParam = options.pageParam || 'page';

		// If actual page is not the first page, show links to first and previous pages.
		if (options.page > 1) {
			result.first = createURLPage(selfURL, pageParam, 1);
			result.prev  = createURLPage(selfURL, pageParam, parseInt(options.page) -1 );
		}

		// If actual page is not the last page, show links to last and next pages.
		if (options.page < options.totalPages) {
			result.next = createURLPage(selfURL, pageParam, parseInt(options.page) +1 );
			result.last = createURLPage(selfURL, pageParam, parseInt(options.totalPages) );
		}
	}

	return result;
};



/*
 * Render App main page
 */
exports.index = function(req, res) {
	res.render('index', {
		user: req.user || null,
		request: req
	});
};


/*
 * Parse query params from URL to modify list results
 */
exports.prepareQueryParams = function(req, res, next) {
	if (req.query && _.size(req.query) ) {
		// limit
		if (!req.query.limit || !_(req.query.limit).chain().parseInt().isFinite() || !_.inRange(req.query.limit, 1, 100) ) {
			delete req.query.limit;
		}

		// page
		if (!req.query.page || !_(req.query.page).chain().parseInt().isFinite() || req.query.page <= 0) {
			delete req.query.page;
		}

		// sort
		if (req.query.sort && _.isString(req.query.sort)) {
			var sortBy = {};

			req.query.sort.split(',').forEach( function(field) {
				if ( _.startsWith(field, '-') ) {
					sortBy[_.trimLeft(field, '-')] = -1;
				} else {
					sortBy[field] = 1;
				}

			});
			req.query.sort = sortBy;

		} else {
			delete req.query.sort;
		}

		// fields
		// TODO
		delete req.query.fields;


		// filter
		if (req.query.filter && _.isObject(req.query.filter) ) {
			var query = {};

			_.forEach(req.query.filter, function(value, key) {
				query[key] = value.toLowerCase();
			});
			req.query.filter = query;

		} else {
			delete req.query.filter;
		}

	}

	return next();
};


/**
 * Get root point for ReST API
 */
exports.getApiRootPoint = function(req, res) {
	var user 		= req.user,
		apiVersion	= req.apiVersion,
		isAdmin 	= (user && user.roles && user.roles.indexOf('admin') !== -1),
		response	= {};

	if (user === undefined || user._id === undefined) {
		apiVersion = 'nologin';
	}

	// Prepare response in JSON+HAL format.
	switch(apiVersion) {
		case '1':
			response = {
				_links: {
					self: {
						href: '/api/v1/'
					},
					lastApiVersion: {
						href: '/api/v1/'
					},
					'users': {
						href: '/api/v1/users'
					},
					'me': {
						href: '/api/v1/users/' + user._id
					},
					'groupbuys': {
						href: '/api/v1/groupbuys'
					}
				}
			};
			break;
		case 'nologin':
			response = {
				_links: {
					self: {
						href: '/api/v1/'
					},
					lastApiVersion: {
						href: '/api/v1/'
					},
					'login': {
						href: '/api/v1/users/login'
					}
				}
			};

			break;
		default: {
			response = {
				_links: {
					lastApiVersion: {
						href: '/api/v1/'
					}
				}
			};
		}

	}

	res.jsonp(response);
};


/**
 * Obtain API version number for API
 */
exports.versionByNumber = function(req, res, next, apiVersion) {
	req.apiVersion = apiVersion;
	next();
};