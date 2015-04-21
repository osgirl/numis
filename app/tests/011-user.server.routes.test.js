/*jshint expr: true*/

'use strict';

var mongoose = require('mongoose'),
	should = require('should'),
	request = require('supertest'),
	_ = require('lodash'),
	app = require('../../server'),
	User = mongoose.model('User'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentialsA, credentials1, credentials2, admin, user1, user2;

/**
 * User routes tests
 */
describe('User CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentialsA = {
			username: 'admin',
			password: 'password'
		};

		credentials1 = {
			username: 'user1',
			password: 'password'
		};

		credentials2 = {
			username: 'jdoe',
			password: 'password'
		};

		// Create a new user
		admin = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@example.net',
			username: credentialsA.username,
			password: credentialsA.password,
			provider: 'local',
			roles: ['user', 'admin']
		});

		// Define another users
		user1 = new User({
			firstName: 'User',
			lastName: 'One',
			email: 'user1@example.net',
			username: credentials1.username,
			password: credentials1.password,
			provider: 'local',
			roles: ['user']
		});

		// Remove old previous data
		User.remove(function(err) {
			if (err) console.error(err);

			// Save a user to the test db and create new User
			admin.save(function(err) {
				if (err) console.error(err);

				user1.save(function(err) {
					if (err) console.error(err);

					// Define user2
					user2 = {
						firstName: 'John',
						lastName: 'Doe',
						email: 'jdoe@example.net',
						username: credentials2.username,
						password: credentials2.password,
						provider: 'local'
					};

					done();
				});
			});
		});
	});

	/*
	 *  NU_P_Gxyy_Eabb:
	 *          x) Test side:
	 *              0 - Server
	 *              1 - Client
	 *
	 *          yy) Module:
	 *              00 - Currencies
	 *              01 - Users
	 *              02 - Groupbuys
	 *              03 - Items
	 *              04 - Orders
	 *              05 - Messages
	 *
	 *          a) Subgroup (in Server side):
	 *              0 - Mongoose
	 *              1 - REST API
	 *              2 - Pagination, sorting and filtering
	 *              3 - Permission
	 *
	 *          bb) Test number
	 */


	it('NU_P_G001_E101: should be able to save User instance if have admin role', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(201)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						// Handle User save error
						if (userSaveErr) done(userSaveErr);

						userSaveRes.body.should.be.an.Object.not.be.empty;

						userSaveRes.body.should.have.properties('_id', 'name', 'username');
						userSaveRes.body.should.have.propertyByPath('_links', 'self', 'href');
						userSaveRes.body.should.have.propertyByPath('_links', 'avatar', 'href');

						(userSaveRes.body.username).should.be.equal(user2.username);
						(userSaveRes.body.firstName).should.be.equal(user2.firstName);
						(userSaveRes.body.lastName).should.be.equal(user2.lastName);
						(userSaveRes.body.email).should.be.equal(user2.email);
						(userSaveRes.body.provider).should.be.equal(user2.provider);

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E102: should not be able to save User instance if have not admin role', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(403)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						(userSaveRes.body.name).should.match('NotAuthorized');
						(userSaveRes.body.message).should.match('User is not authorized');

						done(userSaveErr);
					});
			});
	});

	it('NU_P_G001_E103: should not be able to save User instance if not logged in', function(done) {
		agent.post('/api/v1/users')
			.send(user2)
			.expect(401)
			.expect('Content-Type', /json/)
			.end(function(userSaveErr, userSaveRes) {
				// Set assertions
				(userSaveRes.body.name).should.match('NotLogged');
				(userSaveRes.body.message).should.match('User is not logged in');

				// Call the assertion callback
				done(userSaveErr);
			});
	});

	it('NU_P_G001_E104: should not be able to save User instance if no firstName, lastNmae, email, username are provided', function(done) {
		user2.firstName = '';
		user2.lastName = '';
		user2.email = '';
		user2.username = '';

		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(400)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						// Set message assertions
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.name).should.match('ValidationError');

						(userSaveRes.body).should.have.propertyByPath('errors', 'firstName', 'message');
						(userSaveRes.body).should.have.propertyByPath('errors', 'lastName', 'message');
						(userSaveRes.body).should.have.propertyByPath('errors', 'email', 'message');
						(userSaveRes.body).should.have.propertyByPath('errors', 'username', 'message');

						(userSaveRes.body.errors.firstName.message).should.match('Please fill in your first name');
						(userSaveRes.body.errors.lastName.message).should.match('Please fill in your last name');
						(userSaveRes.body.errors.email.message).should.match('Please fill in your email');
						(userSaveRes.body.errors.username.message).should.match('Please fill in a username');

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_P_G001_E105: should not be able to save User instance if email is not valid', function(done) {
		// Invalidate email field
		user2.email = 'fake email@';

		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(400)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						//console.log('userSaveRes: ', userSaveRes.body);

						// Set message assertion
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.name).should.match('ValidationError');

						(userSaveRes.body).should.have.propertyByPath('errors', 'email', 'message');
						(userSaveRes.body.errors.email.message).should.match('Please fill a valid email address');

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_P_G001_E106: should not be able to save User instance if username already exists', function(done) {
		// Duplicate username field
		user2.username = admin.username;

		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(400)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						//console.log('userSaveRes: ', userSaveRes.body);

						// Set message assertion
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.name).should.match('DuplicateError');
						//(userSaveRes.body).should.have.property('message');

						(userSaveRes.body).should.have.propertyByPath('errors', 'username', 'message');
						(userSaveRes.body.errors.username.path).should.match('username');
						(userSaveRes.body.errors.username.type).should.match('unique');
						(userSaveRes.body.errors.username.code).should.match(11000);

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_P_G001_E107: should not be able to save User instance if password has less than 8 characters', function(done) {
		// Duplicate username field
		user2.password = '1234567';

		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(400)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						//console.log('userSaveRes: ', userSaveRes.body);

						// Set message assertion
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.name).should.match('ValidationError');

						(userSaveRes.body).should.have.propertyByPath('errors', 'password', 'message');
						(userSaveRes.body.errors.password.message).should.match('Password should be longer');

						// Handle User save error
						done(userSaveErr);
					});
			});
	});

	it('NU_P_G001_E109: should be able to update my User profile if signed in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				// Update User name and home address
				admin.firstName = 'Fred';
				admin.lastName = 'Flintstones';
				admin.homeAddress = '301 Cobblestone Way, Bedrock 70777';
				admin.username = 'Flintstones';

				// Update existing User
				agent.put('/api/v1/users/' + userId)
					.send(admin)
					.expect(200)
					.expect('Content-Type', /json/)
					.end(function(userUpdateErr, userUpdateRes) {
						// Handle User update error
						if (userUpdateErr) done(userUpdateErr);

						// Set assertions
						(userUpdateRes.body).should.be.an.Object.not.be.empty;
						(userUpdateRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(userUpdateRes.body).should.have.propertyByPath('_links', 'avatar', 'href');
						(userUpdateRes.body).should.have.propertyByPath('_links', 'collection', 'href');
						(userUpdateRes.body).should.have.propertyByPath('_links', 'groupbuys', 'href');
						(userUpdateRes.body).should.have.propertyByPath('_links', 'password', 'href');

						(userUpdateRes.body).should.have.properties('_id', 'name', 'firstName', 'lastName');
						(userUpdateRes.body).should.have.properties('homeAddress', 'username', 'email');
						(userUpdateRes.body.firstName).should.match(admin.firstName);
						(userUpdateRes.body.lastName).should.match(admin.lastName);
						(userUpdateRes.body.homeAddress).should.match(admin.homeAddress);
						(userUpdateRes.body.username).should.match(admin.username);

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E110: should not be able to update another User profile if have not admin role', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = admin.id;

				// Update User name and home address
				admin.firstName = 'Fred';
				admin.lastName = 'Flintstones';
				admin.homeAddress = '301 Cobblestone Way, Bedrock 70777';
				admin.username = 'Flintstones';

				// Update existing User
				agent.put('/api/v1/users/' + userId)
					.send(admin)
					.expect(403)
					.expect('Content-Type', /json/)
					.end(function(userUpdateErr, userUpdateRes) {
						(userUpdateRes.body.name).should.match('NotAuthorized');
						(userUpdateRes.body.message).should.match('User is not authorized');

						done(userUpdateErr);
					});
			});
	});

	it('NU_P_G001_E111: should not be able to update User instance if not signed in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				agent.get('/api/v1/auth/signout')
					.expect(302)	// Redirect to '/'
					.end(function(signoutErr, signoutRes) {
						// Handle signin error
						if (signoutErr) done(signoutErr);

						// Update User name and home address
						admin.firstName = 'Fred';
						admin.lastName = 'Flintstones';
						admin.displayName = 'The Flintstones';
						admin.homeAddress = '301 Cobblestone Way, Bedrock 70777';

						// Update existing User
						agent.put('/api/v1/users/' + userId)
							.send(admin)
							.expect(401)
							.expect('Content-Type', /json/)
							.end(function(userUpdateErr, userUpdateRes) {
								// Handle User update error
								if (userUpdateErr) done(userUpdateErr);

								//console.log('userSaveRes: ', userUpdateRes.body);

								// Set assertions
								(userUpdateRes.body.name).should.match('NotLogged');
								(userUpdateRes.body.message).should.match('User is not logged in');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G001_E112: should be able to get a list of Users if signed in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Users
				agent.get('/api/v1/users')
					.expect(200)
					.expect('Content-Type', /json/)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');

						(users._embedded.users).should.be.an.Array.with.lengthOf(2);

						// Check first user of the list
						(users._embedded.users[0]).should.have.properties('_id', 'name', 'username', '_links');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'self', 'href');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'avatar', 'href');
						(users._embedded.users[0].username).should.be.equal(admin.username);

						// Check second user of the list
						(users._embedded.users[1]).should.have.properties('_id', 'name', 'username', '_links');
						(users._embedded.users[1]).should.have.propertyByPath('_links', 'self', 'href');
						(users._embedded.users[1]).should.have.propertyByPath('_links', 'avatar', 'href');
						(users._embedded.users[1].username).should.be.equal(user1.username);

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E113: should not be able to get a list of Users if not signed in', function(done) {
		// Request Users
		agent.get('/api/v1/users')
			.expect(401)
			.expect('Content-Type', /json/)
			.end(function(req, res) {
				// Set assertion
				(res.body.name).should.match('NotLogged');
				(res.body.message).should.match('User is not logged in');

				// Call the assertion callback
				done();
			});
	});

	it('NU_P_G001_E114: should be able to get a single User if signed in', function(done) {
		var userObj = new User(user2);

		// Save the User
		userObj.save(function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentialsA)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Request Users
					agent.get('/api/v1/users/' + userObj.id)
						.expect(200)
						.expect('Content-Type', /json/)
						.end(function(userFetchErr, userFetchRes) {
							// Set assertion
							(userFetchRes.body).should.be.an.Object.not.be.empty;
							(userFetchRes.body).should.have.propertyByPath('_links', 'self', 'href');

							// First user is the new user
							(userFetchRes.body).should.have.properties('email', 'firstName', 'lastName', 'name', 'username');
							(userFetchRes.body.username).should.be.equal(userObj.username);
							(userFetchRes.body.firstName).should.be.equal(userObj.firstName);
							(userFetchRes.body.lastName).should.be.equal(userObj.lastName);
							(userFetchRes.body.email).should.be.equal(userObj.email);

							// Call the assertion callback
							done();
						});

				});
		});
	});

	it('NU_P_G001_E115: should not be able to get a single User if not signed in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				agent.get('/api/v1/auth/signout')
					.expect(302)	// Redirect to '/'
					.end(function(signoutErr, signoutRes) {
						// Handle signin error
						if (signoutErr) done(signoutErr);

						// Request User
						agent.get('/api/v1/users/' + userId)
							.expect(401)
							.expect('Content-Type', /json/)
							.end(function(req, res) {
								// Set assertion
								(res.body.name).should.match('NotLogged');
								(res.body.message).should.match('User is not logged in');

								// Call the assertion callback
								done();
						});
				});
		});
	});

	it('NU_P_G001_E116: should be able to delete User instance if have admin role', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(201)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						// Handle User save error
						if (userSaveErr) done(userSaveErr);

						// Delete existing User
						agent.delete('/api/v1/users/' + userSaveRes.body._id)
							.expect(204)
							.end(function(userDeleteErr, userDeleteRes) {
								// Handle User error error
								if (userDeleteErr) done(userDeleteErr);

								// Set assertions
								(userDeleteRes.body).should.be.empty;

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G001_E117: should not be able to delete User instance if not signed in', function(done) {
		// Create new User model instance
		var userObj = new User(user2);

		// Save the User
		userObj.save(function(err) {
			if (err) console.error(err);

			// Try deleting User
			agent.delete('/api/v1/users/' + userObj.id)
				.expect(401)
				.expect('Content-Type', /json/)
				.end(function(userDeleteErr, userDeleteRes) {
					// Set message assertion
					(userDeleteRes.body.message).should.match('User is not logged in');

					// Handle User error error
					done(userDeleteErr);
				});

		});
	});

	it('NU_P_G001_E118: should be register a User instance', function(done) {
		var newUser = {
			firstName: 'New',
			lastName: 'User',
			email: 'newuser@example.net',
			username: 'newuser',
			password: 'password',
		};

		agent.post('/api/v1/auth/signup')
			.send(newUser)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signupErr, signupRes) {
				// Handle signin error
				if (signupErr) done(signupErr);

				signupRes.body.should.be.an.Object.not.be.empty;

				signupRes.body.should.have.properties('_id', 'name', 'username', 'firstName','lastName');
				signupRes.body.should.have.properties('email', 'provider', 'roles');

				signupRes.body.should.have.propertyByPath('_links', 'self', 'href');
				signupRes.body.should.have.propertyByPath('_links', 'avatar', 'href');

				(signupRes.body.username).should.be.equal(newUser.username);
				(signupRes.body.firstName).should.be.equal(newUser.firstName);
				(signupRes.body.lastName).should.be.equal(newUser.lastName);
				(signupRes.body.email).should.be.equal(newUser.email);
				(signupRes.body.provider).should.be.equal('local');
				(signupRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(0);

				agent.post('/api/v1/auth/signin')
					.send({username: 'newuser', password: 'password'})
					.expect(200)
					.expect('Content-Type', /json/)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						agent.get('/api/v1/users/' + signupRes.body._id)
							.expect(403)
							.expect('Content-Type', /json/)
							.end(function(userFetchErr, userFetchRes) {
								(userFetchRes.body.name).should.match('NotAuthorized');
								(userFetchRes.body.message).should.match('User is not authorized');

								// Call the assertion callback
								done(userFetchErr);
							});
					});
			});
	});

	it('NU_P_G001_E119: should be able to approve a new user if have admin role', function(done) {
		var userObj = new User(user2);

		// Save the User to approve
		userObj.save(function(err) {
			if (err) console.error(err);

			userObj.roles.should.be.instanceof(Array).and.have.lengthOf(0);

			// Login as user with admin role
			agent.post('/api/v1/auth/signin')
				.send(credentialsA)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Approve new user
					agent.post('/api/v1/users/' + userObj.id + '/approve')
						.expect(200)
						.expect('Content-Type', /json/)
						.end(function(userApproveErr, userApproveRes) {
							if (userApproveErr) done(userApproveErr);

							// Set assertion
							(userApproveRes.body).should.be.an.Object.not.be.empty;

							// First user is the new user
							(userApproveRes.body).should.have.properties('username', 'provider', 'roles');
							(userApproveRes.body.username).should.be.equal(userObj.username);
							(userApproveRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(1);
							(userApproveRes.body.roles).should.containDeep(['user']);

							// Call the assertion callback
							done();
						});

				});
		});
	});

	it('NU_P_G001_E120: should not be able to approve a new user if have not admin role', function(done) {
		var userObj = new User(user2);

		// Save the User to approve
		userObj.save(function(err) {
			if (err) console.error(err);

			userObj.roles.should.be.instanceof(Array).and.have.lengthOf(0);

			// Login as user with admin role
			agent.post('/api/v1/auth/signin')
				.send(credentials1)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Approve new user
					agent.post('/api/v1/users/' + userObj.id + '/approve')
						.expect(403)
						.expect('Content-Type', /json/)
						.end(function(userApproveErr, userApproveRes) {
							(userApproveRes.body.name).should.match('NotAuthorized');
							(userApproveRes.body.message).should.match('User is not authorized');

							done(userApproveErr);
						});

				});
		});
	});

	it('NU_P_G001_E121: should be able to suspend an user who have requested it if have admin role', function(done) {
		user2.roles = ['user', 'request-suspend']; // User is approved and rquested suspend the acount to admins
		var userObj = new User(user2);

		// Save the User to approve
		userObj.save(function(err) {
			if (err) console.error(err);

			// Login as user with admin role
			agent.post('/api/v1/auth/signin')
				.send(credentialsA)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Approve new user
					agent.post('/api/v1/users/' + userObj.id + '/suspend')
						.expect(200)
						.expect('Content-Type', /json/)
						.end(function(userApproveErr, userApproveRes) {
							if (userApproveErr) done(userApproveErr);

							// Set assertion
							(userApproveRes.body).should.be.an.Object.not.be.empty;

							// First user is the new user
							(userApproveRes.body).should.have.properties('username', 'roles');
							(userApproveRes.body.username).should.be.equal(userObj.username);
							(userApproveRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(0);

							// Call the assertion callback
							done();
						});

				});
		});
	});

	it('NU_P_G001_E122: should not be able to suspend an user who have requested it if have not admin role', function(done) {
		user2.roles = ['user', 'request-suspend']; // User is approved and rquested suspend the acount to admins
		var userObj = new User(user2);

		// Save the User to approve
		userObj.save(function(err) {
			if (err) console.error(err);

			// Login as user with admin role
			agent.post('/api/v1/auth/signin')
				.send(credentials1)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Approve new user
					agent.post('/api/v1/users/' + userObj.id + '/suspend')
						.expect(403)
						.expect('Content-Type', /json/)
						.end(function(userApproveErr, userApproveRes) {
							(userApproveRes.body.name).should.match('NotAuthorized');
							(userApproveRes.body.message).should.match('User is not authorized');

							done(userApproveErr);
						});

				});
		});
	});

	it('NU_P_G001_E123: should be able to update another User profile if have admin role', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the user ID to user1
				var userId = user1.id;

				// Update User name and home address
				user1.firstName = 'Fred';
				user1.lastName = 'Flintstones';
				user1.homeAddress = '301 Cobblestone Way, Bedrock 70777';
				user1.username = 'Flintstones';

				// Update existing User
				agent.put('/api/v1/users/' + userId)
					.send(user1)
					.expect(200)
					.expect('Content-Type', /json/)
					.end(function(userUpdateErr, userUpdateRes) {
						if (userUpdateErr) done(userUpdateErr);

						(userUpdateRes.body).should.have.properties('_id', 'firstName', 'lastName', 'homeAddress', 'username');
						(userUpdateRes.body._id).should.match(user1.id);
						(userUpdateRes.body.firstName).should.match(user1.firstName);
						(userUpdateRes.body.lastName).should.match(user1.lastName);
						(userUpdateRes.body.homeAddress).should.match(user1.homeAddress);
						(userUpdateRes.body.username).should.match(user1.username);

						done();
					});
			});
	});

	it('NU_P_G001_E124: should be able to save a new user specifying roles if have admin role', function(done) {
		user2.roles = ['user', 'admin'];

		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.post('/api/v1/users')
					.send(user2)
					.expect(201)
					.expect('Content-Type', /json/)
					.end(function(userSaveErr, userSaveRes) {
						if (userSaveErr) done(userSaveErr);

						// Set assertions
						(userSaveRes.body).should.be.an.Object.not.be.empty;
						(userSaveRes.body.username).should.match(user2.username);
						(userSaveRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(2);
						(userSaveRes.body.roles).should.containDeep(['user', 'admin']);

						done();
					});
			});
	});

	it('NU_P_G001_E125: should not be able to update an user specifying roles', function(done) {
		user1.roles = ['user', 'admin'];

		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new User
				agent.put('/api/v1/users/' + user1.id)
					.send(user1)
					.expect(200)
					.expect('Content-Type', /json/)
					.end(function(userUpdateErr, userUpdateRes) {
						if (userUpdateErr) done(userUpdateErr);

						// Set assertions
						(userUpdateRes.body).should.be.an.Object.not.be.empty;
						(userUpdateRes.body.username).should.match(user1.username);
						(userUpdateRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(1);
						(userUpdateRes.body.roles).should.containDeep(['user']);

						done();
					});
			});
	});

	it('NU_P_G001_E126: should be able to grant admin role to an user if have admin role', function(done) {
		// Login as user with admin role
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Approve new user
				agent.put('/api/v1/users/' + user1.id + '/admin')
					.expect(200)
					.expect('Content-Type', /json/)
					.end(function(userAdminErr, userAdminRes) {
						if (userAdminErr) done(userAdminErr);

						// Set assertion
						(userAdminRes.body).should.be.an.Object.not.be.empty;

						// First user is the new user
						(userAdminRes.body).should.have.properties('username', 'roles');
						(userAdminRes.body.username).should.be.equal(user1.username);
						(userAdminRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(2);
						(userAdminRes.body.roles).should.containDeep(['user', 'admin']);
						(userAdminRes.body.roles).should.containDeep(['admin', 'user']);

						// Call the assertion callback
						done();
					});

			});
	});

	it('NU_P_G001_E127: should not be able to grant admin role to an user if have not admin role', function(done) {
		// Login as user with admin role
		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Approve new user
				agent.put('/api/v1/users/' + admin.id + '/admin')
					.expect(403)
					.expect('Content-Type', /json/)
					.end(function(userAdminErr, userAdminRes) {
						(userAdminRes.body.name).should.match('NotAuthorized');
						(userAdminRes.body.message).should.match('User is not authorized');

						done(userAdminErr);
					});

			});
	});

	it('NU_P_G001_E128: should be able to revoke admin role from an user if have admin role', function(done) {
		user2.roles = ['user', 'admin'];
		var userObj = new User(user2);

		// Save the User to approve
		userObj.save(function(err) {
			if (err) console.error(err);

			// Login as user with admin role
			agent.post('/api/v1/auth/signin')
				.send(credentialsA)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Approve new user
					agent.delete('/api/v1/users/' + userObj.id + '/admin')
						.expect(200)
						.expect('Content-Type', /json/)
						.end(function(userAdminErr, userAdminRes) {
							if (userAdminErr) done(userAdminErr);

							// Set assertion
							(userAdminRes.body).should.be.an.Object.not.be.empty;

							// First user is the new user
							(userAdminRes.body).should.have.properties('username', 'roles');
							(userAdminRes.body.username).should.be.equal(userObj.username);
							(userAdminRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(1);
							(userAdminRes.body.roles).should.containDeep(['user']);

							// Call the assertion callback
							done();
						});

				});
		});
	});

	it('NU_P_G001_E129: should not be able to revoke admin role from an user if have not admin role', function(done) {
		user2.roles = ['user', 'admin'];
		var userObj = new User(user2);

		// Save the User to approve
		userObj.save(function(err) {
			if (err) console.error(err);

			// Login as user with admin role
			agent.post('/api/v1/auth/signin')
				.send(credentials1)
				.expect(200)
				.expect('Content-Type', /json/)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Approve new user
					agent.delete('/api/v1/users/' + userObj.id + '/admin')
						.expect(403)
						.expect('Content-Type', /json/)
						.end(function(userAdminErr, userAdminRes) {
							(userAdminRes.body.name).should.match('NotAuthorized');
							(userAdminRes.body.message).should.match('User is not authorized');

							done(userAdminErr);
						});

				});
		});
	});

	it('NU_P_G001_E130: should be able to recover user account after forgotten password', function(done) {
		agent.post('/api/v1/auth/forgot')
			.send({username: user1.username})
			.end(function(forgotErr, forgotRes) {
				// Handle signin error
				if (forgotErr) done(forgotErr);

				// The system send a email to user email account.
				// Get the token from user profile.
				User.findById(user1.id, '+resetPasswordToken +resetPasswordExpires', function(err, user) {
					// Handle signin error
					if (err) done(err);

					user.should.have.properties('_id', 'salt', 'password', 'resetPasswordToken', 'resetPasswordExpires');

					(user.resetPasswordToken).should.not.be.equal(undefined);
					(user.resetPasswordExpires).should.not.be.equal(undefined);

					var oldSalt     = user.salt,
						oldPassword = user.password,
						newPassword = '123456789';

					agent.get('/api/v1/auth/reset/' + user.resetPasswordToken)
						.expect(302)
						.end(function(resetErr, resetRes) {
							// Handle signin error
							if (resetErr) done(resetErr);

							resetRes.body.should.be.an.Object.be.empty;

							// Check redirection
							(resetRes.header.location).should.containEql('/password/reset/' + user.resetPasswordToken);

							agent.post('/api/v1/auth/reset/' + user.resetPasswordToken)
								.send({newPassword: newPassword, verifyPassword: newPassword})
								.expect(200)
								.expect('Content-Type', /json/)
								.end(function(reset2Err, reset2Res) {
									// Handle signin error
									if (reset2Err) done(reset2Err);

									reset2Res.body.should.be.an.Object.not.be.empty;

									(reset2Res.body.password).should.not.be.equal(oldPassword);
									(reset2Res.body.salt).should.not.be.equal(oldSalt);

									// Login with new credentials
									agent.post('/api/v1/auth/signin')
										.send({username: user1.username, password: newPassword})
										.expect(200)
										.expect('Content-Type', /json/)
										.end(function(signinErr, signinRes) {
											// Handle signin error
											if (signinErr) done(signinErr);

											signinRes.body.should.be.an.Object.not.be.empty;

											signinRes.body.should.have.properties('_id', 'username');
											signinRes.body.should.have.propertyByPath('_links', 'self', 'href');
											signinRes.body.should.have.propertyByPath('_links', 'avatar', 'href');

											(signinRes.body.username).should.be.equal(user1.username);

											// Call the assertion callback
											done();
										});
								});
						});
				});
			});
	});

	it('NU_P_G001_E131: should be not able to recover another user account', function(done) {
		var fakePasswordToken = 'e9b2ebd5879c167db65a9ffca57ea781814b8c27';

		agent.post('/api/v1/auth/forgot')
			.send({username: user1.username})
			.end(function(forgotErr, forgotRes) {
				// Handle signin error
				if (forgotErr) done(forgotErr);

				// The system send a email to user email account.
				// Get the token from user profile.
				User.findById(user1.id, function(err, user) {
					// Handle signin error
					if (err) done(err);

					user.should.have.properties('_id', 'salt', 'password');

					var oldSalt     = user.salt,
						oldPassword = user.password,
						newPassword = '123456789';

					agent.get('/api/v1/auth/reset/' + fakePasswordToken)
						.expect(302)
						.end(function(resetErr, resetRes) {
							// Handle signin error
							if (resetErr) done(resetErr);

							resetRes.body.should.be.an.Object.be.empty;

							// Check redirection to invalid token page
							(resetRes.header.location).should.containEql('/password/reset/invalid');

							agent.post('/api/v1/auth/reset/' + fakePasswordToken)
								.send({newPassword: newPassword, verifyPassword: newPassword})
								.expect(200)
								.expect('Content-Type', /json/)
								.end(function(reset2Err, reset2Res) {
									(reset2Res.body.message).should.match('Password reset token is invalid or has expired.');

									// Login with new credentials
									agent.post('/api/v1/auth/signin')
										.send({username: user1.username, password: newPassword})
										.expect(400)
										.expect('Content-Type', /json/)
										.end(function(signinErr, signinRes) {
											(signinRes.body.message).should.match('Unknown user or invalid password');

											done(signinErr);
										});
								});
						});
				});
			});
	});

	it.skip('NU_P_G001_E132: should be able to upload an image to use as my avatar if signed in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = signinRes.body._id;

				// Update existing User
				agent.put('/api/v1/users/' + userId + '/avatar')
					.attach('image', './app/tests/images/avatar.png')
					.expect(200)
					.end(function(userAvatarErr, userAvatarRes) {
						// Handle User update error
						if (userAvatarErr) done(userAvatarErr);

						console.log (userAvatarRes.body);

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E133: should not be able to upload an image to use as my avatar if not signed in', function(done) {
		// Get the userId
		var userId = user1.id;

		// Update existing User
		agent.put('/api/v1/users/' + userId + '/avatar')
			.attach('image', './app/tests/images/avatar.png')
			.expect(401)
			.end(function(userAvatarErr, userAvatarRes) {
				// Set assertions
				(userAvatarRes.body.name).should.match('NotLogged');
				(userAvatarRes.body.message).should.match('User is not logged in');

				// Call the assertion callback
				done(userAvatarErr);
			});
	});

	it('NU_P_G001_E134: should not be able to upload an image to use as another user avatar if signed in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = admin.id;

				// Update existing User
				agent.put('/api/v1/users/' + userId + '/avatar')
					.attach('image', './app/tests/images/avatar.png')
					.expect(403)
					.end(function(userAvatarErr, userAvatarRes) {
						(userAvatarRes.body.name).should.match('NotAuthorized');
						(userAvatarRes.body.message).should.match('User is not authorized');

						done(userAvatarErr);
					});
			});
	});

	it('NU_P_G001_E136: should be able to request suspend my user account if signed it', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Request suspend signed in user account
				agent.post('/api/v1/users/' + user1.id + '/request-suspend')
					.expect(200)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.end(function(userRequestErr, userRequestRes) {
						if (userRequestErr) done(userRequestErr);

						// Set assertion
						(userRequestRes.body).should.be.an.Object.not.be.empty;

						// First user is the new user
						(userRequestRes.body).should.have.properties('username', 'roles');
						(userRequestRes.body.username).should.be.equal(user1.username);
						(userRequestRes.body.roles).should.be.instanceof(Array).and.have.lengthOf(2);
						(userRequestRes.body.roles).should.containDeep(['user', 'request-suspend']);

						// Call the assertion callback
						done();
					});

			});
	});

	it('NU_P_G001_E137: should not be able to request suspend another user account', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Request suspend another user account
				agent.post('/api/v1/users/' + user1.id + '/request-suspend')
					.expect(403)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.end(function(userRequestErr, userRequestRes) {
						(userRequestRes.body.name).should.match('NotAuthorized');
						(userRequestRes.body.message).should.match('User is not authorized');

						done(userRequestErr);
					});

			});
	});

	it('NU_P_G001_E138: should not be able to request suspend user account if not signed in', function(done) {
		// Request suspend another user account
		agent.post('/api/v1/users/' + user1.id + '/request-suspend')
			.expect(401)
			.set('Accept', 'application/json')
			.expect('Content-Type', /json/)
			.end(function(userRequestErr, userRequestRes) {
				// Set assertions
				(userRequestRes.body.name).should.match('NotLogged');
				(userRequestRes.body.message).should.match('User is not logged in');

				done(userRequestErr);
			});
	});


	afterEach(function(done) {
		agent.get('/api/v1/auth/signout')
			.end(done);
	});

});