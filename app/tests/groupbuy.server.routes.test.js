/*jshint expr: true*/

'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, groupbuy;

/**
 * Groupbuy routes tests
 */
describe('Groupbuy CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		// Create a new user
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Remove old previous data
		Groupbuy.remove().exec();
		User.remove().exec();

		// Save a user to the test db and create new Groupbuy
		user.save(function() {
			groupbuy = {
				title: 'Groupbuy Name',
				description: 'Groupbuy Description'
			};

			done();
		});
	});

	it('NU_T_G002_E101: should be able to save Groupbuy instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						(groupbuySaveRes.body).should.have.property('_id');
						(groupbuySaveRes.body.title).should.match(groupbuy.title);
						(groupbuySaveRes.body.description).should.match(groupbuy.description);
						(groupbuySaveRes.body.status).should.match('new');

						// Get a list of Groupbuys
						agent.get('/api/v1/groupbuys')
							.expect(200)
							.end(function(groupbuysGetErr, groupbuysGetRes) {
								// Handle Groupbuy save error
								if (groupbuysGetErr) done(groupbuysGetErr);

								// Get Groupbuys list
								var groupbuys = groupbuysGetRes.body._embedded.groupbuys;

								// Set assertions
								groupbuys.should.be.an.Array.with.lengthOf(1);
								(groupbuys[0]._id).should.equal(groupbuySaveRes.body._id);
								(groupbuys[0].title).should.match(groupbuySaveRes.body.title);
								(groupbuys[0].name).should.match(groupbuySaveRes.body.name);
								(groupbuys[0].description).should.match(groupbuySaveRes.body.description);
								(groupbuys[0].status).should.match('new');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G002_E102: should not be able to save Groupbuy instance if not logged in', function(done) {
		agent.get('/auth/signout')
			.expect(302)	// Redirect to '/'
			.end(function(signoutErr, signoutRes) {
				// Handle signin error
				if (signoutErr) done(signoutErr);

				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(401)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Set message assertion
						(groupbuySaveRes.body.name).should.match('NotLogged');

						// Call the assertion callback
						done(groupbuySaveErr);
					});
			});
	});

	it('NU_T_G002_E103: should not be able to save Groupbuy instance if no title is provided', function(done) {
		// Invalidate name field
		groupbuy.title = '';
		groupbuy.name = '_';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(400)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Set message assertion
						(groupbuySaveRes.body.name).should.match('ValidationError');
						(groupbuySaveRes.body.errors.title.path).should.match('title');
						(groupbuySaveRes.body.errors.title.type).should.match('required');
						//(groupbuySaveRes.body.errors.title.message).should.match('Please fill Groupbuy title');

						// Handle Groupbuy save error
						done(groupbuySaveErr);
					});
			});
	});

	it('NU_T_G002_E104: should not be able to save Groupbuy instance if no description is provided', function(done) {
		// Invalidate name field
		groupbuy.description = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(400)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Set message assertion
						(groupbuySaveRes.body.name).should.match('ValidationError');
						(groupbuySaveRes.body.errors.description.path).should.match('description');
						(groupbuySaveRes.body.errors.description.type).should.match('required');
						//(groupbuySaveRes.body.message).should.match('Please fill Groupbuy description');

						// Handle Groupbuy save error
						done(groupbuySaveErr);
					});
			});
	});

	it('NU_T_G002_E105: should be able to update Groupbuy instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						// Update Groupbuy name
						groupbuy.title = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Groupbuy
						agent.put('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
							.send(groupbuy)
							.expect(204)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								// Handle Groupbuy update error
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								// Set assertions
								(groupbuyUpdateRes.body).should.be.empty;

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G002_E106: should not be able to get a list of Groupbuys if not signed in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function() {
			// Request Groupbuys
			request(app).get('/api/v1/groupbuys')
				.expect(401)
				.end(function(req, res) {
					// Set assertion
					(res.body.name).should.match('NotLogged');
					(res.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done();
				});

		});
	});


	it('NU_T_G002_E107: should not be able to get a single Groupbuy if not signed in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function() {
			request(app).get('/api/v1/groupbuys/' + groupbuyObj._id)
				.expect(401)
				.end(function(req, res) {
					// Set assertion
					(res.body.name).should.match('NotLogged');
					(res.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done();
				});
		});
	});

	it('NU_T_G002_E108: should be able to delete Groupbuy instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						// Delete existing Groupbuy
						agent.delete('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
							.send(groupbuy)
							.expect(204)
							.end(function(groupbuyDeleteErr, groupbuyDeleteRes) {
								// Handle Groupbuy error error
								if (groupbuyDeleteErr) done(groupbuyDeleteErr);

								// Set assertions
								(groupbuyDeleteRes.body).should.be.empty;

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_T_G002_E109: should not be able to delete Groupbuy instance if not signed in', function(done) {
		// Set Groupbuy user
		groupbuy.user = user;

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function() {
			// Try deleting Groupbuy
			request(app).delete('/api/v1/groupbuys/' + groupbuyObj._id)
			.expect(401)
			.end(function(groupbuyDeleteErr, groupbuyDeleteRes) {
				// Set message assertion
				(groupbuyDeleteRes.body.message).should.match('User is not logged in');

				// Handle Groupbuy error error
				done(groupbuyDeleteErr);
			});

		});
	});
});