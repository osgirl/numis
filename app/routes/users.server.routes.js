'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');

module.exports = function(app) {
	// User Routes
	var users = require('../../app/controllers/users.server.controller');

	// Users Routes
	app.route('/api/v1/users')
		.get(users.requiresLogin, users.hasAuthorization(['user']), users.list)
		.post(users.requiresLogin, users.hasAuthorization(['admin']), users.create);

	app.route('/api/v1/users/me').get(users.requiresLogin, users.me);

	app.route('/api/v1/users/:userId')
		.get(users.requiresLogin, users.hasAuthorization(['user']), users.read)
		.put(users.requiresLogin, users.hasAuthorization(['self','admin']), users.update)
		.delete(users.requiresLogin, users.hasAuthorization(['self','admin']), users.delete);

	// Users avatar Routes
	app.route('/api/v1/users/:userId/avatar')
		.get(users.requiresLogin, users.hasAuthorization(['user']), users.getAvatar)
		.put(users.requiresLogin, users.hasAuthorization(['self','admin']), users.updateAvatar)
		.delete(users.requiresLogin, users.hasAuthorization(['self','admin']), users.deleteAvatar);

//	app.route('/api/v1/users/accounts').delete(users.removeOAuthProvider);
	// Setting up the users password api
	app.route('/api/v1/users/password').post(users.requiresLogin, users.hasAuthorization(['user']), users.changePassword);
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