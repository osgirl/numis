/*jshint expr: true*/

'use strict';

var should   = require('should'),
	request  = require('supertest'),
	app      = require('../../server'),
	mongoose = require('mongoose'),
	User     = mongoose.model('User'),
	Currency = mongoose.model('Currency'),
	Groupbuy = mongoose.model('Groupbuy'),
	agent    = request.agent(app);

/**
 * Globals
 */
var credentials, credentialsA, user, admin, groupbuy;
var currency, currency2;

/**
 * Groupbuy routes tests
 */
describe('Groupbuy CRUD tests', function() {
	before(function(done) {
		currency = new Currency({
			name: 'Euro',
			code: 'EUR',
			symbol: '€',
			priority: 100
		});

		currency2 = new Currency({
			name: 'Japanese Yen',
			code: 'JPY',
			symbol: '¥'
		});

		// Remove old previous data
		Currency.remove().exec(function(err) {
			if (err) console.error(err);

			// Save new currencies
			currency.save(function(err) {
				if (err) console.error(err);
				currency2.save(function(err) {
					if (err) console.error(err);

					done();
				});
			});
		});
	});

	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		credentialsA = {
			username: 'admin',
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
			provider: 'local',
			roles: ['user']
		});

		// Create a new admin user
		admin = new User({
			firstName: 'Admin',
			lastName: 'Istrator',
			displayName: 'Admin Istrator',
			email: 'admin@test.com',
			username: credentialsA.username,
			password: credentialsA.password,
			provider: 'local',
			roles: ['user', 'admin']
		});

		// Remove old previous data
		Groupbuy.remove(function(err) {
			if (err) console.error(err);

			User.remove(function(err) {
				if (err) console.error(err);

				// Save a user to the test db and create new Groupbuy
				user.save(function(err) {
					if (err) console.error(err);

					groupbuy = {
						title: 'Groupbuy Name',
						description: 'Groupbuy Description',
						user: user._id
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
	 *
	 *          bb) Test number
	 */


	it('NU_P_G002_E101: should be able to save Groupbuy instance if logged in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						(groupbuySaveRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuySaveRes.body).should.have.propertyByPath('_links', 'collection', 'href');
						(groupbuySaveRes.body).should.have.propertyByPath('_links', 'items', 'href');
						(groupbuySaveRes.body).should.have.propertyByPath('_links', 'managers', 'href');
						(groupbuySaveRes.body).should.have.propertyByPath('_links', 'members', 'href');

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

								(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

								// Get Groupbuys list
								var groupbuys = groupbuysGetRes.body._embedded.groupbuys;
								// Set assertions
								groupbuys.should.be.an.Array.with.lengthOf(1);
								(groupbuys[0]._id).should.equal(groupbuySaveRes.body._id);
								(groupbuys[0].title).should.match(groupbuySaveRes.body.title);
								(groupbuys[0].name).should.match(groupbuySaveRes.body.name);
								(groupbuys[0].description).should.match(groupbuySaveRes.body.description);
								(groupbuys[0].status).should.match('new');

								(groupbuys[0].currencies.local._id).should.match(currency.id);
								(groupbuys[0].currencies.local.name).should.match(currency.name);
								(groupbuys[0].currencies.local.symbol).should.match(currency.symbol);
								(groupbuys[0].currencies.provider._id).should.match(currency.id);
								(groupbuys[0].currencies.provider.name).should.match(currency.name);
								(groupbuys[0].currencies.provider.symbol).should.match(currency.symbol);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G002_E102: should not be able to save Groupbuy instance if not logged in', function(done) {
		agent.post('/api/v1/groupbuys')
			.send(groupbuy)
			.expect(401)
			.end(function(groupbuySaveErr, groupbuySaveRes) {
				// Set message assertion
				(groupbuySaveRes.body.name).should.match('NotLogged');
				(groupbuySaveRes.body.message).should.match('User is not logged in');

				// Call the assertion callback
				done(groupbuySaveErr);
			});
	});

	it('NU_P_G002_E103: should not be able to save Groupbuy instance if no title is provided', function(done) {
		// Invalidate name field
		groupbuy.title = '';
		groupbuy.name = '_';

		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

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

	it('NU_P_G002_E104: should not be able to save Groupbuy instance if no description is provided', function(done) {
		// Invalidate name field
		groupbuy.description = '';

		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

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

	it('NU_P_G002_E105: should be able to update title and description of a Groupbuy if have manager role', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						// Update Groupbuy name
						groupbuy.title = 'WHY YOU GOTTA BE SO MEAN?';
						groupbuy.description = 'New description';

						// Update existing Groupbuy
						agent.put('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
							.send(groupbuy)
							.expect(200)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								// Handle Groupbuy update error
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								// Set assertions
								(groupbuyUpdateRes.body).should.be.an.Object.not.be.empty;
								(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'self', 'href');
								(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'collection', 'href');
								(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'items', 'href');
								(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'managers', 'href');
								(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'members', 'href');
								(groupbuyUpdateRes.body).should.have.properties('_id', 'title', 'name', 'description', 'status', 'nextState');
								(groupbuyUpdateRes.body).should.have.properties('managers', 'members', 'updates', 'visibility');

								// Not changed
								(groupbuyUpdateRes.body._id).should.match(groupbuySaveRes.body._id);
								(groupbuyUpdateRes.body.status).should.match(groupbuySaveRes.body.status);
								(groupbuyUpdateRes.body.nextState).should.match(groupbuySaveRes.body.nextState);
								(groupbuyUpdateRes.body.managers).should.match(groupbuySaveRes.body.managers);
								(groupbuyUpdateRes.body.members).should.match(groupbuySaveRes.body.members);
								(groupbuyUpdateRes.body.updates).should.match(groupbuySaveRes.body.updates);
								(groupbuyUpdateRes.body.visibility).should.match(groupbuySaveRes.body.visibility);

								// Changed
								(groupbuyUpdateRes.body.title).should.match(groupbuy.title);
								(groupbuyUpdateRes.body.description).should.match(groupbuy.description);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G002_E106: should not be able to get a list of Groupbuys if not signed in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function(err) {
			if (err) console.error(err);

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

	it('NU_P_G002_E107: should not be able to get a single Groupbuy if not signed in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function(err) {
			if (err) console.error(err);

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

	it('NU_P_G002_E108: should be able to delete Groupbuy instance if the user is a platform admin', function(done) {
		admin.save(function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentialsA)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

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
	});

	it('NU_P_G002_E109: should not be able to delete Groupbuy instance if the user is not a platform admin', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

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
							.expect(403)
							.end(function(groupbuyDeleteErr, groupbuyDeleteRes) {
								(groupbuyDeleteRes.body.name).should.match('NotAuthorized');
								(groupbuyDeleteRes.body.message).should.match('User is not authorized');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G002_E110: should not be able to delete Groupbuy instance if not signed in', function(done) {
		// Set Groupbuy user
		groupbuy.user = user;

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Save the Groupbuy
		groupbuyObj.save(function(err) {
			if (err) console.error(err);

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

	it('NU_P_G002_E111: should be able to get a list of Groupbuys that an user belong to if signed in', function(done) {
		admin.save(function(err) {
			if (err) console.error(err);

	        // Create new Groupbuy model instance
	        var groupbuyObj = new Groupbuy(groupbuy);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

	            agent.post('/api/v1/auth/signin')
	                .send(credentialsA)
	                .set('Accept', 'application/json')
	                .expect('Content-Type', /json/)
	                .expect(200)
	                .end(function(signinErr, signinRes) {
	                    // Handle signin error
	                    if (signinErr) done(signinErr);

	                    // Get groupbuys that users belong to
						agent.get('/api/v1/users/'+ user.id + '/groupbuys')
	                        .expect(200)
	                        .end(function(groupbuysGetErr, groupbuysGetRes) {
	                            // Handle Groupbuy save error
	                            if (groupbuysGetErr) done(groupbuysGetErr);

	                            // Get Groupbuys list
	                            var groupbuys = groupbuysGetRes.body._embedded.groupbuys;

	                            // Set assertions
	                            groupbuys.should.be.an.Array.with.lengthOf(1);

	                            (groupbuys[0].title).should.match(groupbuyObj.title);
	                            (groupbuys[0].description).should.match(groupbuyObj.description);
	                            (groupbuys[0].status).should.match(groupbuyObj.status);

	                            // Handle Groupbuy error error
	                            done();
	                        });

	                });
			});
		});
	});

	it('NU_P_G002_E112: should be able to save Groupbuy with diferent local and provider currencies', function(done) {
		var groupbuy2 = {
				title: '500 yenes - Serie Prefecturas',
				description: 'Compra de la serie monedas de 500 yen sobre las 47 prefecturas de Japón',
				currencies: {
					local: currency.id,
					provider: currency2.id,
					exchangeRate: 130.123456789,
					multiplier: 1.23456789
				}
			},
			exchangeRate = 130.123457;

		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy2)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						(groupbuySaveRes.body.currencies.multiplier).should.match(groupbuy2.currencies.multiplier);
						(groupbuySaveRes.body.currencies.exchangeRate).should.match(exchangeRate);

						// Get groupbuy info
						agent.get('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
							.expect(200)
							.end(function(groupbuyGetErr, groupbuyGetRes) {
								// Handle Order save error
								if (groupbuyGetErr) done(groupbuyGetErr);

								(groupbuyGetRes.body.currencies.multiplier).should.match(groupbuySaveRes.body.currencies.multiplier);
								(groupbuyGetRes.body.currencies.exchangeRate).should.match(groupbuySaveRes.body.currencies.exchangeRate);

								(groupbuyGetRes.body.currencies.local._id).should.match(currency.id);
								(groupbuyGetRes.body.currencies.local.name).should.match(currency.name);
								(groupbuyGetRes.body.currencies.local.symbol).should.match(currency.symbol);
								(groupbuyGetRes.body.currencies.provider._id).should.match(currency2.id);
								(groupbuyGetRes.body.currencies.provider.name).should.match(currency2.name);
								(groupbuyGetRes.body.currencies.provider.symbol).should.match(currency2.symbol);

								done();
							});
					});
			});
	});

	it('NU_P_G002_E113: should be able to get a list of new groupbuys if signed it', function(done) {
		var groupbuy2 = {
			title: 'Groupbuy 2',
			description: 'Groupbuy Description',
			user: user.id,
			status: 'published'
		};

        // Create new Groupbuy model instance
        var groupbuyObj = new Groupbuy(groupbuy),
			groupbuyObj2 = new Groupbuy(groupbuy2);

        // Add a manager and save the Groupbuy
		groupbuyObj2.save(function(err) {
			if (err) console.error(err);

	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

	            agent.post('/api/v1/auth/signin')
	                .send(credentials)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
	                .expect(200)
	                .end(function(signinErr, signinRes) {
	                    // Handle signin error
	                    if (signinErr) done(signinErr);

	                    // Get groupbuys that users belong to
	                    agent.get('/api/v1/groupbuys')
							.query({ filter: {status: 'new'} })
							.set('Accept', 'application/json')
			                .expect('Content-Type', /json/)
	                        .expect(200)
	                        .end(function(groupbuysGetErr, groupbuysGetRes) {
	                            // Handle Groupbuy save error
	                            if (groupbuysGetErr) done(groupbuysGetErr);

	                            // Get Groupbuys list
	                            var groupbuys = groupbuysGetRes.body._embedded.groupbuys;

	                            // Set assertions
	                            groupbuys.should.be.an.Array.with.lengthOf(1);

	                            (groupbuys[0].title).should.match(groupbuyObj.title);
	                            (groupbuys[0].description).should.match(groupbuyObj.description);
	                            (groupbuys[0].status).should.match(groupbuyObj.status);

	                            // Handle Groupbuy error error
	                            done();
	                        });

	                });
			});
        });
	});

	it('NU_P_G002_E114: should be able to get a list of published groupbuys if signed it', function(done) {
		var groupbuy2 = {
			title: 'Groupbuy 2',
			description: 'Groupbuy Description',
			user: user.id,
			status: 'published'
		};

        // Create new Groupbuy model instance
        var groupbuyObj = new Groupbuy(groupbuy),
			groupbuyObj2 = new Groupbuy(groupbuy2);

        // Add a manager and save the Groupbuy
		groupbuyObj2.save(function(err) {
			if (err) console.error(err);

	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

	            agent.post('/api/v1/auth/signin')
	                .send(credentials)
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
	                .expect(200)
	                .end(function(signinErr, signinRes) {
	                    // Handle signin error
	                    if (signinErr) done(signinErr);

	                    // Get groupbuys that users belong to
	                    agent.get('/api/v1/groupbuys')
							.query({ filter: {status: 'published'} })
							.set('Accept', 'application/json')
			                .expect('Content-Type', /json/)
	                        .expect(200)
	                        .end(function(groupbuysGetErr, groupbuysGetRes) {
	                            // Handle Groupbuy save error
	                            if (groupbuysGetErr) done(groupbuysGetErr);

	                            // Get Groupbuys list
	                            var groupbuys = groupbuysGetRes.body._embedded.groupbuys;

	                            // Set assertions
	                            groupbuys.should.be.an.Array.with.lengthOf(1);

	                            (groupbuys[0].title).should.match(groupbuyObj2.title);
	                            (groupbuys[0].description).should.match(groupbuyObj2.description);
	                            (groupbuys[0].status).should.match(groupbuyObj2.status);

	                            // Handle Groupbuy error error
	                            done();
	                        });

	                });
			});
        });
	});

	it('NU_P_G002_E115: should not be able to update Groupbuy if have not manager role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				// Add a member and save the Groupbuy
		        groupbuyObj.addMember(member.id, function(err) {
					if (err) console.error(err);

					agent.post('/api/v1/auth/signin')
						.send({username: 'member1', password: 'password'})
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update Groupbuy name
							groupbuy.title = 'WHY YOU GOTTA BE SO MEAN?';
							groupbuy.description = 'New description';

							// Update existing Groupbuy
							agent.put('/api/v1/groupbuys/' + groupbuyObj.id)
								.send(groupbuy)
								.expect(403)
								.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
									(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
									(groupbuyUpdateRes.body.message).should.match('User is not authorized');

									// Call the assertion callback
									done(groupbuyUpdateErr);
								});
						});
				});
			});
		});
	});

	it('NU_P_G002_E116: should not be able to update Groupbuy if not signed in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

        // Add a manager and save the Groupbuy
        groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			// Update Groupbuy name
			groupbuy.title = 'WHY YOU GOTTA BE SO MEAN?';
			groupbuy.description = 'New description';

			// Update existing Groupbuy
			agent.put('/api/v1/groupbuys/' + groupbuyObj.id)
				.send(groupbuy)
				.expect(401)
				.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
					(groupbuyUpdateRes.body.name).should.match('NotLogged');
					(groupbuyUpdateRes.body.message).should.match('User is not logged in');

					// Call the assertion callback
					done(groupbuyUpdateErr);
				});
		});
	});

	it('NU_P_G002_E117: should be able to add update info in a Groupbuy instance if have manager role', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						// Update Groupbuy name
						groupbuy.updates = [{
							publishDate: Date.now(),
							textInfo: 'Update 1'
						}];

						// Update existing Groupbuy
						agent.put('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
							.send(groupbuy)
							.expect(200)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								// Handle Groupbuy update error
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								// Set assertions
								(groupbuyUpdateRes.body).should.be.an.Object.not.be.empty;
								(groupbuyUpdateRes.body).should.have.properties('updates');

								// Changed
								(groupbuyUpdateRes.body.updates).should.be.an.Array.with.lengthOf(1);
								(groupbuyUpdateRes.body.updates[0].textInfo).should.match(groupbuy.updates[0].textInfo);

								// Update Groupbuy name
								groupbuy.updates.push({
									publishDate: Date.now(),
									textInfo: 'Update 2'
								});

								// Update existing Groupbuy
								agent.put('/api/v1/groupbuys/' + groupbuySaveRes.body._id)
									.send(groupbuy)
									.expect(200)
									.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
										// Handle Groupbuy update error
										if (groupbuyUpdateErr) done(groupbuyUpdateErr);

										// Set assertions
										(groupbuyUpdateRes.body).should.be.an.Object.not.be.empty;
										(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'self', 'href');
										(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'items', 'href');
										(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'managers', 'href');
										(groupbuyUpdateRes.body).should.have.propertyByPath('_links', 'members', 'href');
										(groupbuyUpdateRes.body).should.have.properties('_id', 'title', 'name', 'description', 'status', 'nextState');
										(groupbuyUpdateRes.body).should.have.properties('managers', 'members', 'updates', 'visibility');
										(groupbuyUpdateRes.body).should.have.properties('updates');

										// Not changed
										(groupbuyUpdateRes.body._id).should.match(groupbuySaveRes.body._id);
										(groupbuyUpdateRes.body.status).should.match(groupbuySaveRes.body.status);
										(groupbuyUpdateRes.body.nextState).should.match(groupbuySaveRes.body.nextState);
										(groupbuyUpdateRes.body.managers).should.match(groupbuySaveRes.body.managers);
										(groupbuyUpdateRes.body.members).should.match(groupbuySaveRes.body.members);
										(groupbuyUpdateRes.body.updates).should.match(groupbuySaveRes.body.updates);
										(groupbuyUpdateRes.body.visibility).should.match(groupbuySaveRes.body.visibility);
										(groupbuyUpdateRes.body.title).should.match(groupbuySaveRes.body.title);
										(groupbuyUpdateRes.body.description).should.match(groupbuySaveRes.body.description);

										// Changed
										(groupbuyUpdateRes.body.updates).should.be.an.Array.with.lengthOf(2);
										(groupbuyUpdateRes.body.updates[0].textInfo).should.match('Update 1');
										(groupbuyUpdateRes.body.updates[1].textInfo).should.match('Update 2');


										// Call the assertion callback
										done();
									});
							});
					});
			});
	});

	it('NU_P_G002_E118: should be able to update the visibility of a Groupbuy if have manager role', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			(groupbuyObj).should.have.properties('visibility');
			(groupbuyObj.visibility).should.be.an.Object.not.be.empty;

			// Default values
			(groupbuyObj.visibility.items).should.match('public');
			(groupbuyObj.visibility.managers).should.match('public');
			(groupbuyObj.visibility.members).should.match('public');
			(groupbuyObj.visibility.itemNumbers).should.match('public');
			(groupbuyObj.visibility.itemsByMember).should.match('restricted');
			(groupbuyObj.visibility.paymentStatus).should.match('restricted');
			(groupbuyObj.visibility.shipmentsState).should.match('restricted');

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					groupbuyObj.visibility.members = 'restricted';
					groupbuyObj.visibility.itemsByMember = 'private';
					groupbuyObj.visibility.paymentStatus = 'private';
					groupbuyObj.visibility.shipmentsState = 'private';

					// Update existing Groupbuy
					agent.put('/api/v1/groupbuys/' + groupbuyObj.id)
						.send(groupbuyObj)
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body).should.have.properties('visibility');
							(groupbuyUpdateRes.body.visibility).should.be.an.Object.not.be.empty;

							(groupbuyUpdateRes.body.visibility.items).should.match('public');
							(groupbuyUpdateRes.body.visibility.managers).should.match('public');
							(groupbuyUpdateRes.body.visibility.members).should.match('restricted');
							(groupbuyUpdateRes.body.visibility.itemNumbers).should.match('public');
							(groupbuyUpdateRes.body.visibility.itemsByMember).should.match('private');
							(groupbuyUpdateRes.body.visibility.paymentStatus).should.match('private');
							(groupbuyUpdateRes.body.visibility.shipmentsState).should.match('private');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E119: should not be able to update the visibility of a Groupbuy with unsupported values', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					groupbuyObj.visibility.items = 'private'; 	// Only 'public' value is supported
					groupbuyObj.visibility.managers = 'yes'; 	// Only 'public' value is supported
					groupbuyObj.visibility.members = '';		// Only 'private', 'restricted', 'public' values are supported

					// Update existing Groupbuy
					agent.put('/api/v1/groupbuys/' + groupbuyObj.id)
						.send(groupbuyObj)
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body).should.have.propertyByPath('errors', 'visibility.members', 'name');
							(groupbuyUpdateRes.body).should.have.propertyByPath('errors', 'visibility.managers', 'name');
							(groupbuyUpdateRes.body).should.have.propertyByPath('errors', 'visibility.items', 'name');

							// Handle Groupbuy save error
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E120: should be able change Groupbuy state to published if have manager role and actual state is new', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Groupbuy
				agent.post('/api/v1/groupbuys')
					.send(groupbuy)
					.expect(201)
					.end(function(groupbuySaveErr, groupbuySaveRes) {
						// Handle Groupbuy save error
						if (groupbuySaveErr) done(groupbuySaveErr);

						(groupbuySaveRes.body).should.be.an.Object.not.be.empty;
						(groupbuySaveRes.body).should.have.properties('_id', 'title', 'name', 'description', 'status', 'nextState');
						(groupbuySaveRes.body.status).should.match('new');

						var groupbuyId = groupbuySaveRes.body._id;

						// Update Groupbuy status
						agent.post('/api/v1/groupbuys/' + groupbuyId + '/go-to/published')
							.expect(200)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								// Handle Groupbuy update error
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								// Set assertions
								(groupbuyUpdateRes.body._id).should.match(groupbuyId);
								(groupbuyUpdateRes.body.status).should.match('published');

								// Check Groupbuy status
								agent.get('/api/v1/groupbuys/' + groupbuyId)
									.expect(200)
									.end(function(groupbuyGetErr, groupbuyGetRes) {
										if (groupbuyGetErr) done(groupbuyGetErr);

										// Set assertions
										(groupbuyGetRes.body._id).should.match(groupbuyId);
										(groupbuyGetRes.body.status).should.match('published');

										// Call the assertion callback
										done();
									});
							});
					});
			});
	});

	it('NU_P_G002_E121: should not be able change Groupbuy state to published if have not manager role and actual state is new', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

			// Add a manager and save the Groupbuy
			groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				(groupbuyObj.status).should.match('new');

				// Add a member and save the Groupbuy
				groupbuyObj.addMember(member.id, function(err) {
					if (err) console.error(err);

					agent.post('/api/v1/auth/signin')
						.send({username: 'member1', password: 'password'})
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update Groupbuy status
							agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/published')
								.expect(403)
								.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
									(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
									(groupbuyUpdateRes.body.message).should.match('User is not authorized');

									// Call the assertion callback
									done(groupbuyUpdateErr);
								});
						});
				});
			});
		});
	});

	it('NU_P_G002_E122: should not be able change Groupbuy state to payments if have manager role and actual state is new', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/payments')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. Valid destination state is published');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E123: should be able to update the currencies of a Groupbuy if have manager role', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			(groupbuyObj).should.have.properties('currencies');
			(groupbuyObj.currencies).should.be.an.Object.not.be.empty;
			(groupbuyObj.currencies.local).should.be.an.Object.not.be.empty;
			(groupbuyObj.currencies.provider).should.be.an.Object.not.be.empty;

			// Default values
			(groupbuyObj.currencies.exchangeRate).should.match(1);
			(groupbuyObj.currencies.multiplier).should.match(1);
			(groupbuyObj.currencies.local).should.match(currency._id);
			(groupbuyObj.currencies.provider).should.match(currency._id);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					groupbuyObj.currencies.exchangeRate = 123.45;
					groupbuyObj.currencies.multiplier = 1.05;
					groupbuyObj.currencies.local = currency.id;
					groupbuyObj.currencies.provider = currency2.id;

					// Update existing Groupbuy
					agent.put('/api/v1/groupbuys/' + groupbuyObj.id)
						.send(groupbuyObj)
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body).should.have.properties('currencies');
							(groupbuyUpdateRes.body.currencies).should.be.an.Object.not.be.empty;
							(groupbuyUpdateRes.body.currencies.local).should.be.an.Object.not.be.empty;
							(groupbuyUpdateRes.body.currencies.provider).should.be.an.Object.not.be.empty;

							(groupbuyUpdateRes.body.currencies.exchangeRate).should.match(123.45);
							(groupbuyUpdateRes.body.currencies.multiplier).should.match(1.05);
							(groupbuyUpdateRes.body.currencies.local.code).should.match('EUR');
							(groupbuyUpdateRes.body.currencies.provider.code).should.match('JPY');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E124: should be able change Groupbuy state to acceptance if have manager role and actual state is published', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'published';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/acceptance')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('acceptance');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E125: should not be able change Groupbuy state to acceptance if have manager role but actual state is not published', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'new';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/acceptance')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. Valid destination state is published');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E126: should be able change Groupbuy state to payments if have manager role and actual state is acceptance', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'acceptance';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/payments')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('payments');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E127: should not be able change Groupbuy state to payments if have manager role but actual state is not acceptance', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'published';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/payments')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. Valid destination state is acceptance');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E128: should be able change Groupbuy state to paid if have manager role and actual state is payments', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'payments';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/paid')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('paid');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E129: should not be able change Groupbuy state to paid if have manager role but actual state is not payments', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'published';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/paid')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. Valid destination state is acceptance');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E130: should be able change Groupbuy state to shipments if have manager role and actual state is paid', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'paid';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/shipments')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('shipments');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E131: should not be able change Groupbuy state to shipments if have manager role but actual state is not paid', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'payments';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/shipments')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. Valid destination state is paid');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E132: should be able to close a Groupbuy if have manager role and actual state is shipments', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'shipments';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/closed')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('closed');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E133: should not be able to close a Groupbuy if have manager role but actual state is not shipments', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'paid';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/closed')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. Valid destination state is shipments');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E134: should be able to cancel a Groupbuy if have manager role and actual state is acceptance', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'acceptance';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('cancelled');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E135: should be able to cancel a Groupbuy if have manager role and actual state is payments', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'payments';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('cancelled');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E136: should be able to cancel a Groupbuy if have manager role and actual state is paid', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'paid';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('cancelled');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E137: should be able to cancel a Groupbuy if have manager role and actual state is shipments', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'shipments';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(200)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							// Set assertions
							(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
							(groupbuyUpdateRes.body.status).should.match('cancelled');

							// Call the assertion callback
							done();
						});
				});
		});
	});

	it('NU_P_G002_E138: should not be able to cancel a Groupbuy if actual state is new', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'new';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. The groupbuy isn\'t suitable to be cancelled.');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E139: should not be able to cancel a Groupbuy if actual state is published', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'published';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(400)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('ValidationError');
							(groupbuyUpdateRes.body.message).should.match('Invalid change state. The groupbuy isn\'t suitable to be cancelled.');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E140: should not be able to cancel a Groupbuy if actual state is closed', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'closed';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(403)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
							(groupbuyUpdateRes.body.message).should.match('User is not authorized');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E141: should not be able to cancel a Groupbuy if actual state is deleted', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'deleted';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/cancelled')
						.expect(403)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							// Handle Groupbuy update error
							if (groupbuyUpdateErr) done(groupbuyUpdateErr);

							(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
							(groupbuyUpdateRes.body.message).should.match('User is not authorized');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E142: should be able to restore a cancelled a Groupbuy if the user is a platform admin', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'cancelled';
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			// Add a manager and save the Groupbuy
			groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				agent.post('/api/v1/auth/signin')
					.send(credentialsA)
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						// Update Groupbuy status
						agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/published')
							.expect(200)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								// Handle Groupbuy update error
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								// Set assertions
								(groupbuyUpdateRes.body._id).should.match(groupbuyObj.id);
								(groupbuyUpdateRes.body.status).should.match('published');

								// Call the assertion callback
								done();
							});
					});
			});
		});
	});

	it('NU_P_G002_E143: should not be able to restore a cancelled a Groupbuy if have manager role', function(done) {
		// Create new Groupbuy model instance
		groupbuy.status = 'cancelled';
		var groupbuyObj = new Groupbuy(groupbuy);

		// Add a manager and save the Groupbuy
		groupbuyObj.addManager(user.id, function(err) {
			if (err) console.error(err);

			(groupbuyObj.status).should.match('cancelled');

			agent.post('/api/v1/auth/signin')
				.send(credentials)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Update Groupbuy status
					agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/go-to/published')
						.expect(403)
						.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
							(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
							(groupbuyUpdateRes.body.message).should.match('User is not authorized');

							// Call the assertion callback
							done(groupbuyUpdateErr);
						});
				});
		});
	});

	it('NU_P_G002_E144: should be able to add a manager into a Groupbuy if the user is a platform admin', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

		        // Add a manager and save the Groupbuy
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					// Sign in as a platform admin
					agent.post('/api/v1/auth/signin')
						.send(credentialsA)
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update existing Groupbuy
							agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/managers')
								.send({userId: member.id})
								.expect(204)
								.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
									if (groupbuyUpdateErr) done(groupbuyUpdateErr);

									(groupbuyUpdateRes.body).should.be.empty;

									// Call the assertion callback
									done();
								});
						});
				});
			});
		});
	});

	it('NU_P_G002_E145: should be able to add a manager into a Groupbuy if have manager role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				// Sign in as a manager
				agent.post('/api/v1/auth/signin')
					.send(credentials)
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						// Update existing Groupbuy
						agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/managers')
							.send({userId: member.id})
							.expect(204)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								(groupbuyUpdateRes.body).should.be.empty;

								// Call the assertion callback
								done();
							});
					});
			});
		});
	});

	it('NU_P_G002_E146: should not be able to add a manager into a Groupbuy if have not manager role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				agent.post('/api/v1/auth/signin')
					.send({username: 'member1', password: 'password'})
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						// Update existing Groupbuy
						agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/managers')
							.send({userId: member.id})
							.expect(403)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
								(groupbuyUpdateRes.body.message).should.match('User is not authorized');

								// Call the assertion callback
								done(groupbuyUpdateErr);
							});
					});
			});
		});
	});

	it('NU_P_G002_E147: should be able to remove a manager from a Groupbuy if the user is a platform admin', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

		        // Add a manager and save the Groupbuy
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					groupbuyObj.addManager(member.id, function(err) {
						if (err) console.error(err);

						// Sign in as a platform admin
						agent.post('/api/v1/auth/signin')
							.send(credentialsA)
							.expect(200)
							.end(function(signinErr, signinRes) {
								// Handle signin error
								if (signinErr) done(signinErr);

								// Update existing Groupbuy
								agent.delete('/api/v1/groupbuys/' + groupbuyObj.id + '/managers/' + member.id)
									.expect(204)
									.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
										if (groupbuyUpdateErr) done(groupbuyUpdateErr);

										(groupbuyUpdateRes.body).should.be.empty;

										// Call the assertion callback
										done();
									});
							});
					});
				});
			});
		});
	});

	it('NU_P_G002_E148: should be able to remove a manager from a Groupbuy if have manager role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

		        // Add a manager and save the Groupbuy
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					groupbuyObj.addManager(member.id, function(err) {
						if (err) console.error(err);

						// Sign in as manager
						agent.post('/api/v1/auth/signin')
							.send(credentials)
							.expect(200)
							.end(function(signinErr, signinRes) {
								// Handle signin error
								if (signinErr) done(signinErr);

								// Update existing Groupbuy
								agent.delete('/api/v1/groupbuys/' + groupbuyObj.id + '/managers/' + member.id)
									.expect(204)
									.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
										if (groupbuyUpdateErr) done(groupbuyUpdateErr);

										(groupbuyUpdateRes.body).should.be.empty;

										// Call the assertion callback
										done();
									});
							});
					});
				});
			});
		});
	});

	it('NU_P_G002_E149: should not be able to remove a manager from a Groupbuy if have not manager role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				agent.post('/api/v1/auth/signin')
					.send({username: 'member1', password: 'password'})
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						// Update existing Groupbuy
						agent.delete('/api/v1/groupbuys/' + groupbuyObj.id + '/managers/' + user.id)
							.expect(403)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
								(groupbuyUpdateRes.body.message).should.match('User is not authorized');

								// Call the assertion callback
								done(groupbuyUpdateErr);
							});
					});
			});
		});
	});

	it('NU_P_G002_E150: should be able to get details of a Groupbuys that an user belong to if have member role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		groupbuy.status = 'published';
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				// Add a member to the Groupbuy
		        groupbuyObj.addMember(member.id, function(err) {
					if (err) console.error(err);

					// Sign in as a member
		            agent.post('/api/v1/auth/signin')
		                .send({username: 'member1', password: 'password'})
		                .set('Accept', 'application/json')
		                .expect('Content-Type', /json/)
		                .expect(200)
		                .end(function(signinErr, signinRes) {
		                    // Handle signin error
		                    if (signinErr) done(signinErr);

		                    // Get groupbuys that users belong to
							agent.get(signinRes.body._links.groupbuys.href)
		                        .expect(200)
		                        .end(function(groupbuysGetErr, groupbuysGetRes) {
		                            // Handle Groupbuy save error
		                            if (groupbuysGetErr) done(groupbuysGetErr);

		                            // Get Groupbuys list
		                            var groupbuys = groupbuysGetRes.body._embedded.groupbuys;

		                            // Set assertions
		                            groupbuys.should.be.an.Array.with.lengthOf(1);

									(groupbuys[0]._id).should.match(groupbuyObj.id);
		                            (groupbuys[0].title).should.match(groupbuyObj.title);
		                            (groupbuys[0].description).should.match(groupbuyObj.description);
		                            (groupbuys[0].status).should.match(groupbuyObj.status);

									agent.get('/api/v1/groupbuys/' + groupbuyObj.id)
										.expect(200)
				                        .end(function(groupbuysGetErr, groupbuysGetRes) {
											if (groupbuysGetErr) done(groupbuysGetErr);

											(groupbuysGetRes.body).should.have.properties('_id', 'title', 'name', 'description', 'status', 'nextState', 'managers', 'members', 'updates', 'visibility');

											(groupbuysGetRes.body.title).should.match(groupbuyObj.title);
				                            (groupbuysGetRes.body.description).should.match(groupbuyObj.description);

				                            // Handle Groupbuy error error
				                            done();
										});
		                        });

		                });
				});
			});
		});
	});

	it('NU_P_G002_E151: should be able to get a list of managers in a Groupbuy if logged in', function(done) {
		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			// Add a manager and save the Groupbuy
			groupbuyObj.addManager(admin.id, function(err) {
				if (err) console.error(err);

		        // Add another manager
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					// Sign in as a platform admin
					agent.post('/api/v1/auth/signin')
						.send(credentialsA)
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update existing Groupbuy
							agent.get('/api/v1/groupbuys/' + groupbuyObj.id + '/managers')
								.expect(200)
								.end(function(managersGetErr, managersGetRes) {
									if (managersGetErr) done(managersGetErr);

									// Get managers list
									var managers = managersGetRes.body._embedded.managers;

									// Set assertions
									(managersGetRes.body).should.not.be.empty;
									(managersGetRes.body.numElems).should.match(2);
									(managersGetRes.body.totalElems).should.match(2);

									(managers[0]).should.have.propertyByPath('_links', 'self', 'href');
									(managers[1]).should.have.propertyByPath('_links', 'self', 'href');

									(managers[0].username).should.match(admin.username);
									(managers[1].username).should.match(user.username);

									// Call the assertion callback
									done();
								});
						});
				});
			});
		});
	});

	it('NU_P_G002_E152: should be able to get a list of members in a Groupbuy if is public and the user is  logged in', function(done) {
		// Create new Groupbuy model instance
		groupbuy.visibility = {members: 'public'};
		var groupbuyObj = new Groupbuy(groupbuy);

		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

				// Add a manager and save the Groupbuy
				groupbuyObj.addManager(admin.id, function(err) {
					if (err) console.error(err);

			        // Add members
			        groupbuyObj.addMember(user.id, function(err) {
						if (err) console.error(err);

						groupbuyObj.addMember(member.id, function(err) {
							if (err) console.error(err);

							// Sign in as a platform admin
							agent.post('/api/v1/auth/signin')
								.send(credentialsA)
								.expect(200)
								.end(function(signinErr, signinRes) {
									// Handle signin error
									if (signinErr) done(signinErr);

									// Update existing Groupbuy
									agent.get('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
										.expect(200)
										.end(function(membersGetErr, membersGetRes) {
											if (membersGetErr) done(membersGetErr);

											// Get managers list
											var members = membersGetRes.body._embedded.members;

											// Set assertions
											(membersGetRes.body).should.not.be.empty;
											(membersGetRes.body.numElems).should.match(3);
											(membersGetRes.body.totalElems).should.match(3);

											(members[0]).should.have.propertyByPath('_links', 'self', 'href');
											(members[1]).should.have.propertyByPath('_links', 'self', 'href');
											(members[2]).should.have.propertyByPath('_links', 'self', 'href');

											(members[0].username).should.match(admin.username);
											(members[1].username).should.match(member.username);
											(members[2].username).should.match(user.username);

											// Call the assertion callback
											done();
										});
								});
						});
					});
				});
			});
		});
	});

	it('NU_P_G002_E153: should be able to get a list of members in a Groupbuy if is restricted and have member role', function(done) {
		// Create new Groupbuy model instance
		groupbuy.visibility = {members: 'restricted'};
		var groupbuyObj = new Groupbuy(groupbuy);

		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

				// Add a manager and save the Groupbuy
				groupbuyObj.addManager(admin.id, function(err) {
					if (err) console.error(err);

			        // Add members
			        groupbuyObj.addMember(user.id, function(err) {
						if (err) console.error(err);

						groupbuyObj.addMember(member.id, function(err) {
							if (err) console.error(err);

							// Sign in as a platform admin
							agent.post('/api/v1/auth/signin')
								.send(credentials)
								.expect(200)
								.end(function(signinErr, signinRes) {
									// Handle signin error
									if (signinErr) done(signinErr);

									// Update existing Groupbuy
									agent.get('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
										.expect(200)
										.end(function(membersGetErr, membersGetRes) {
											if (membersGetErr) done(membersGetErr);

											// Get managers list
											var members = membersGetRes.body._embedded.members;

											// Set assertions
											(membersGetRes.body).should.not.be.empty;
											(membersGetRes.body.numElems).should.match(3);

											(members[0].username).should.match(admin.username);
											(members[1].username).should.match(member.username);
											(members[2].username).should.match(user.username);

											// Call the assertion callback
											done();
										});
								});
						});
					});
				});
			});
		});
	});

	it('NU_P_G002_E154: should not be able to get a list of members in a Groupbuy if is restricted and have not member role', function(done) {
		// Create new Groupbuy model instance
		groupbuy.visibility = {members: 'restricted'};
		var groupbuyObj = new Groupbuy(groupbuy);

		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

				// Add a manager and save the Groupbuy
				groupbuyObj.addManager(admin.id, function(err) {
					if (err) console.error(err);

					groupbuyObj.addMember(member.id, function(err) {
						if (err) console.error(err);

						// Sign in as a platform admin
						agent.post('/api/v1/auth/signin')
							.send(credentials)
							.expect(200)
							.end(function(signinErr, signinRes) {
								// Handle signin error
								if (signinErr) done(signinErr);

								// Update existing Groupbuy
								agent.get('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
									.expect(403)
									.end(function(membersGetErr, membersGetRes) {
										(membersGetRes.body.name).should.match('NotAuthorized');
										(membersGetRes.body.message).should.match('User is not authorized');

										done(membersGetErr);
									});
							});
					});
				});
			});
		});
	});

	it('NU_P_G002_E155: should be able to get a list of members in a Groupbuy if is privated and have manager role', function(done) {
		// Create new Groupbuy model instance
		groupbuy.visibility = {members: 'private'};
		var groupbuyObj = new Groupbuy(groupbuy);

		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

				// Add a manager and save the Groupbuy
				groupbuyObj.addManager(admin.id, function(err) {
					if (err) console.error(err);

			        // Add members
			        groupbuyObj.addManager(user.id, function(err) {
						if (err) console.error(err);

						groupbuyObj.addMember(member.id, function(err) {
							if (err) console.error(err);

							// Sign in as a platform admin
							agent.post('/api/v1/auth/signin')
								.send(credentials)
								.expect(200)
								.end(function(signinErr, signinRes) {
									// Handle signin error
									if (signinErr) done(signinErr);

									// Update existing Groupbuy
									agent.get('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
										.expect(200)
										.end(function(membersGetErr, membersGetRes) {
											if (membersGetErr) done(membersGetErr);

											// Get managers list
											var members = membersGetRes.body._embedded.members;

											// Set assertions
											(membersGetRes.body).should.not.be.empty;
											(membersGetRes.body.numElems).should.match(3);

											(members[0].username).should.match(admin.username);
											(members[1].username).should.match(member.username);
											(members[2].username).should.match(user.username);

											// Call the assertion callback
											done();
										});
								});
						});
					});
				});
			});
		});
	});

	it('NU_P_G002_E156: should not be able to get a list of members in a Groupbuy if is private and have not manager role', function(done) {
		// Create new Groupbuy model instance
		groupbuy.visibility = {members: 'private'};
		var groupbuyObj = new Groupbuy(groupbuy);

		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

				// Add a manager and save the Groupbuy
				groupbuyObj.addManager(admin.id, function(err) {
					if (err) console.error(err);

					groupbuyObj.addMember(user.id, function(err) {
						if (err) console.error(err);

						groupbuyObj.addMember(member.id, function(err) {
							if (err) console.error(err);

							// Sign in as a platform admin
							agent.post('/api/v1/auth/signin')
								.send(credentials)
								.expect(200)
								.end(function(signinErr, signinRes) {
									// Handle signin error
									if (signinErr) done(signinErr);

									// Update existing Groupbuy
									agent.get('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
										.expect(403)
										.end(function(membersGetErr, membersGetRes) {
											(membersGetRes.body.name).should.match('NotAuthorized');
											(membersGetRes.body.message).should.match('User is not authorized');

											done(membersGetErr);
										});
								});
						});
					});
				});
			});
		});
	});

	it('NU_P_G002_E157: should be able to add as member into a Groupbuy if logged in', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				// Sign in as a member1
				agent.post('/api/v1/auth/signin')
					.send({username: 'member1', password: 'password'})
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						// Update existing Groupbuy
						agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
							.send({userId: member.id})
							.expect(204)
							.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
								if (groupbuyUpdateErr) done(groupbuyUpdateErr);

								(groupbuyUpdateRes.body).should.be.empty;

								// Call the assertion callback
								done();
							});
					});
			});
		});
	});

	it('NU_P_G002_E158: should not be able to add another user as member into a Groupbuy if have admin role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

			admin.save(function(err) {
				if (err) console.error(err);

		        // Add a manager and save the Groupbuy
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					agent.post('/api/v1/auth/signin')
						.send(credentialsA)
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update existing Groupbuy
							agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
								.send({userId: member.id})
								.expect(204)
								.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
									if (groupbuyUpdateErr) done(groupbuyUpdateErr);

									(groupbuyUpdateRes.body).should.be.empty;

									// Call the assertion callback
									done();
								});
						});
				});
			});
		});
	});

	it('NU_P_G002_E159: should not be able to add another user as member into a Groupbuy if have not admin role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

			admin.save(function(err) {
				if (err) console.error(err);

		        // Add a manager and save the Groupbuy
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					agent.post('/api/v1/auth/signin')
						.send(credentials)
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update existing Groupbuy
							agent.post('/api/v1/groupbuys/' + groupbuyObj.id + '/members')
								.send({userId: member.id})
								.expect(403)
								.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
									(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
									(groupbuyUpdateRes.body.message).should.match('User is not authorized');

									// Call the assertion callback
									done(groupbuyUpdateErr);
								});
						});
				});
			});
		});
	});

	it.skip('NU_P_G002_E160: should not be able to remove a member from a Groupbuy if have not manager role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		member.save(function(err) {
			if (err) console.error(err);

	        // Add a manager and save the Groupbuy
	        groupbuyObj.addManager(user.id, function(err) {
				if (err) console.error(err);

				groupbuyObj.addMember(member.id, function(err) {
					if (err) console.error(err);

					agent.post('/api/v1/auth/signin')
						.send({username: 'member1', password: 'password'})
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update existing Groupbuy
							agent.delete('/api/v1/groupbuys/' + groupbuyObj.id + '/members/' + member.id)
								.expect(403)
								.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
									(groupbuyUpdateRes.body.name).should.match('NotAuthorized');
									(groupbuyUpdateRes.body.message).should.match('User is not authorized');

									// Call the assertion callback
									done(groupbuyUpdateErr);
								});
						});
				});
			});
		});
	});

	it('NU_P_G002_E161: should be able to remove a member from a Groupbuy if the user is a platform admin', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

		        // Add a manager and save the Groupbuy
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					groupbuyObj.addMember(member.id, function(err) {
						if (err) console.error(err);

						// Sign in as a platform admin
						agent.post('/api/v1/auth/signin')
							.send(credentialsA)
							.expect(200)
							.end(function(signinErr, signinRes) {
								// Handle signin error
								if (signinErr) done(signinErr);

								// Update existing Groupbuy
								agent.delete('/api/v1/groupbuys/' + groupbuyObj.id + '/members/' + member.id)
									.expect(204)
									.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
										if (groupbuyUpdateErr) done(groupbuyUpdateErr);

										(groupbuyUpdateRes.body).should.be.empty;

										// Call the assertion callback
										done();
									});
							});
					});
				});
			});
		});
	});

	it('NU_P_G002_E162: should be able to remove a member from a Groupbuy if have manager role', function(done) {
		// Create a new user
		var member = new User({
			firstName: 'Member',
			lastName: '1',
			displayName: 'Member 1',
			email: 'member@example.net',
			username: 'member1',
			password: 'password',
			provider: 'local',
			roles: ['user']
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			member.save(function(err) {
				if (err) console.error(err);

		        // Add a manager and save the Groupbuy
		        groupbuyObj.addManager(user.id, function(err) {
					if (err) console.error(err);

					groupbuyObj.addMember(member.id, function(err) {
						if (err) console.error(err);

						// Sign in as manager
						agent.post('/api/v1/auth/signin')
							.send(credentials)
							.expect(200)
							.end(function(signinErr, signinRes) {
								// Handle signin error
								if (signinErr) done(signinErr);

								// Update existing Groupbuy
								agent.delete('/api/v1/groupbuys/' + groupbuyObj.id + '/members/' + member.id)
									.expect(204)
									.end(function(groupbuyUpdateErr, groupbuyUpdateRes) {
										if (groupbuyUpdateErr) done(groupbuyUpdateErr);

										(groupbuyUpdateRes.body).should.be.empty;

										// Call the assertion callback
										done();
									});
							});
					});
				});
			});
		});
	});

	it('NU_P_G002_E163: should be able to view update info in a Groupbuy if have member role', function(done) {
		// Add Updates
		groupbuy.updates = [{
			publishDate: Date.now(),
			textInfo: 'Update 1'
		}];
		groupbuy.updates.push({
			publishDate: Date.now() + 1000,
			textInfo: 'Update 2'
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			// Add a manager and save the Groupbuy
			groupbuyObj.addManager(admin.id, function(err) {
				if (err) console.error(err);

				groupbuyObj.addMember(user.id, function(err) {
					if (err) console.error(err);

					agent.post('/api/v1/auth/signin')
						.send(credentials)
						.expect(200)
						.end(function(signinErr, signinRes) {
							// Handle signin error
							if (signinErr) done(signinErr);

							// Update existing Groupbuy
							agent.get('/api/v1/groupbuys/' + groupbuyObj.id)
								.send(groupbuy)
								.expect(200)
								.end(function(groupbuyGetErr, groupbuyGetRes) {
									// Handle Groupbuy update error
									if (groupbuyGetErr) done(groupbuyGetErr);

									// Set assertions
									(groupbuyGetRes.body).should.be.an.Object.not.be.empty;
									(groupbuyGetRes.body).should.have.properties('updates');

									(groupbuyGetRes.body.updates).should.be.an.Array.with.lengthOf(2);
									(groupbuyGetRes.body.updates[0].textInfo).should.match('Update 1');
									(groupbuyGetRes.body.updates[1].textInfo).should.match('Update 2');

									// Call the assertion callback
									done();
								});
						});
				});
			});
		});
	});

	it('NU_P_G002_E164: should not be able to view update info in a Groupbuy if have not member role', function(done) {
		// Add Updates
		groupbuy.updates = [{
			publishDate: Date.now(),
			textInfo: 'Update 1'
		}];
		groupbuy.updates.push({
			publishDate: Date.now() + 1000,
			textInfo: 'Update 2'
		});

		// Create new Groupbuy model instance
		var groupbuyObj = new Groupbuy(groupbuy);

		admin.save(function(err) {
			if (err) console.error(err);

			// Add a manager and save the Groupbuy
			groupbuyObj.addManager(admin.id, function(err) {
				if (err) console.error(err);

				agent.post('/api/v1/auth/signin')
					.send(credentials)
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						// Update existing Groupbuy
						agent.get('/api/v1/groupbuys/' + groupbuyObj.id)
							.send(groupbuy)
							.expect(200)
							.end(function(groupbuyGetErr, groupbuyGetRes) {
								// Handle Groupbuy update error
								if (groupbuyGetErr) done(groupbuyGetErr);

								// Set assertions
								(groupbuyGetRes.body).should.be.an.Object.not.be.empty;
								(groupbuyGetRes.body).should.not.have.properties('updates');

								// Call the assertion callback
								done();
							});
					});
			});
		});
	});


	afterEach(function(done) {
		agent.get('/api/v1/auth/signout')
			.end(done);
	});
});