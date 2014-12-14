'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	mongoose = require('mongoose'),
	restEndpoints = require('mongoose-rest-endpoints'),
	errorHandler = require('../../app/controllers/errors.server.controller'),
	users = require('../../app/controllers/users.server.controller');

module.exports = function(app) {
	// User Routes
	/*
	 *
	 */
	var prepareFields = function(data, showProtected) {
		// Rename _id field
		data.id = data._id;
		delete data._id;

		// Add links field.
		data.links = [
			{ref: 'self', href: ''},
			{ref: 'user', href: ''},
			{ref: 'avatar', href: ''}
		];

		// Delete private fields fromresponse
		delete data.__v;
		delete data.password;
		delete data.salt;
		delete data.displayName;
		delete data.avatar;

		// Delete protected fields from response
		if (!showProtected) {
			delete data.lastName;
			delete data.firstName;
			delete data.homeAddress;
			delete data.roles;
			delete data.email;
			delete data.provider;
		}
	};

	/*
	*
	*/
	var listPreFilter = function(req, query, next) {

//console.log('LUIS req: ', req.query);

		next(query);
	};


	/*
	 *
	 */
	var fetchPreResponse = function(req, data, next) {
		var isAdmin = (req.user && req.user.roles && req.user.roles.indexOf('admin') !== -1),
			isMe    = (req.user && req.user._id.equals(data._id) );

		prepareFields(data, isAdmin || isMe);

		next(data);
	};

	/*
	 *
	 */
	var listPreResponse = function(req, data, next) {
		var isAdmin = (req.user && req.user.roles && req.user.roles.indexOf('admin') !== -1);

		for (var i = 0; i < data.length; i++) {
			prepareFields(data[i], isAdmin);
		}

		next(data);
	};

	/*
	 *
	 */
	var preResponseError = function(req, error, next) {
		if (error && !error.message)
			error.message = errorHandler.getErrorMessage(error);

		next(error);
	};

// TODO: Comment it!
	//restEndpoints.log.verbose(true);

	// Register end point for '/users' and /users/:id'
	new restEndpoints
				.endpoint('/api/v1/users', 'User', {
					limitFields: ['_id', 'username', 'slug', 'roles'],
					queryParams: ['username', 'slug', 'email', '$in_roles'],
					pagination: {
						perPage: 50,
						sortField: 'username'
					}
				})
				.addMiddleware('*', users.requiresLogin)
				.tap('pre_filter', 'list', listPreFilter)
				.tap('pre_filter', 'fetch', listPreFilter)
				.tap('post_retrieve', 'list', listPreFilter)
				.tap('post_retrieve', 'fetch', listPreFilter)
				.tap('pre_response', 'list', listPreResponse)
				.tap('pre_response', 'fetch', fetchPreResponse)
				.tap('pre_response_error', 'fetch', preResponseError)
				.tap('pre_response_error', 'list', preResponseError)
				.tap('pre_response_error', 'post', preResponseError)
				.tap('pre_response_error', 'put', preResponseError)
				.tap('pre_response_error', 'delete', preResponseError)
				.register(app);



	// Setting up the users profile api
	app.route('/users/me').get(users.me);
	app.route('/users').put( function(req, res, next) {
		res.url = '/api/v1' + res.url;

		next();
	});
//	app.route('/users/accounts').delete(users.removeOAuthProvider);

	// Setting up the users avatar api
	app.route('/api/v1/users/:userId/avatar')
		.get(users.requiresLogin, users.getAvatar)
		.put(users.requiresLogin, users.updateAvatar)
		.delete(users.requiresLogin, users.deleteAvatar);

	// Setting up the users password api
	app.route('/users/password').post(users.changePassword);
	app.route('/auth/forgot').post(users.forgot);
	app.route('/auth/reset/:token').get(users.validateResetToken);
	app.route('/auth/reset/:token').post(users.reset);

	// Setting up the users authentication api
	app.route('/auth/signup').post(users.signup);
	app.route('/auth/signin').post(users.signin);
	app.route('/auth/signout').get(users.signout);

/*
	// Setting the facebook oauth routes
	app.route('/auth/facebook').get(passport.authenticate('facebook', {
		scope: ['email']
	}));
	app.route('/auth/facebook/callback').get(users.oauthCallback('facebook'));

	// Setting the twitter oauth routes
	app.route('/auth/twitter').get(passport.authenticate('twitter'));
	app.route('/auth/twitter/callback').get(users.oauthCallback('twitter'));

	// Setting the google oauth routes
	app.route('/auth/google').get(passport.authenticate('google', {
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}));
	app.route('/auth/google/callback').get(users.oauthCallback('google'));

	// Setting the linkedin oauth routes
	app.route('/auth/linkedin').get(passport.authenticate('linkedin'));
	app.route('/auth/linkedin/callback').get(users.oauthCallback('linkedin'));

	// Setting the github oauth routes
	app.route('/auth/github').get(passport.authenticate('github'));
	app.route('/auth/github/callback').get(users.oauthCallback('github'));
*/

	// Finish by binding the user middleware
	app.param('userId', users.userByID);
};