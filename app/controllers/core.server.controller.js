'use strict';

/**
 * Module dependencies.
 */
exports.index = function(req, res) {
	res.render('index', {
		user: req.user || null,
		request: req
	});
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
					curies: [
						{
							name: 'ht',
							href: '/api/v1/docs/{doc}',
							templated: true
						}
					],
					'ht:users': {
						href: '/api/v1/users'
					},
					'ht:me': {
						href: '/api/v1/users/' + user._id
					},
					'ht:groupbuys': {
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
					curies: [
						{
							name: 'ht',
							href: '/api/v1/docs/{doc}',
							templated: true
						}
					],
					'ht:login': {
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


exports.versionByNumber = function(req, res, next, apiVersion) {
	req.apiVersion = apiVersion;
	next();
};