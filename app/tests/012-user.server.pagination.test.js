/*jshint expr: true*/

'use strict';

var mongoose = require('mongoose'),
	should   = require('should'),
	request  = require('supertest'),
	async    = require('async'),
	crypto   = require('crypto'),
	_        = require('lodash'),
	app      = require('../../server'),
	User     = mongoose.model('User'),
	agent    = request.agent(app);

/**
 * Globals
 */
var credentials, credentialsA, admin, user, data, numUsers;

/**
 * User routes tests
 */
describe('User Pagination tests', function() {
	before(function(done) {
		var username;

		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		credentialsA = {
			username: 'admin',
			password: 'passwordA'
		};

		// Create a new user
		user = new User({
				firstName: 'Full',
				lastName: 'Name',
				email: 'test@example.net',
				username: credentials.username,
				password: credentials.password,
				provider: 'local',
				roles: ['user']
		});

		// Create a new Admin user
		admin = new User({
				firstName: 'Admin',
				lastName: 'Istrator',
				email: 'admin@example.net',
				username: credentialsA.username,
				password: credentialsA.password,
				provider: 'local',
				roles: ['user', 'admin']
		});

		// Generate 100 users
		data = [ { firstName: 'Lacey', lastName: 'Galloway' }, { firstName: 'Patience', lastName: 'Anthony' }, { firstName: 'Wanda', lastName: 'Simpson' }, { firstName: 'Christopher', lastName: 'Davidson' }, { firstName: 'Melissa', lastName: 'Hoover' }, { firstName: 'Blair', lastName: 'Miller' }, { firstName: 'Shelby', lastName: 'Odom' }, { firstName: 'Salvador', lastName: 'Singleton' }, { firstName: 'Yolanda', lastName: 'Petersen' }, { firstName: 'Clementine', lastName: 'Webb' }, { firstName: 'Sydnee', lastName: 'Mccarthy' }, { firstName: 'Garrett', lastName: 'Mcintosh' }, { firstName: 'Maite', lastName: 'Spencer' }, { firstName: 'Kaitlin', lastName: 'Delaney' }, { firstName: 'Dane', lastName: 'Booker' }, { firstName: 'Palmer', lastName: 'Barry' }, { firstName: 'Jamal', lastName: 'Best' }, { firstName: 'Vera', lastName: 'Franklin' }, { firstName: 'Portia', lastName: 'Ferrell' }, { firstName: 'Amaya', lastName: 'Downs' }, { firstName: 'Amity', lastName: 'Ewing' }, { firstName: 'Nadine', lastName: 'Church' }, { firstName: 'Libby', lastName: 'Griffith' }, { firstName: 'Laith', lastName: 'Flowers' }, { firstName: 'Trevor', lastName: 'Peters' }, { firstName: 'Graham', lastName: 'Lara' }, { firstName: 'Kiara', lastName: 'Durham' }, { firstName: 'Chava', lastName: 'Mcclure' }, { firstName: 'Bernard', lastName: 'Blackwell' }, { firstName: 'Heather', lastName: 'Thornton' }, { firstName: 'Rebekah', lastName: 'Mcintosh' }, { firstName: 'Dorian', lastName: 'Chang' }, { firstName: 'Brian', lastName: 'Burt' }, { firstName: 'Judith', lastName: 'Becker' }, { firstName: 'Mariko', lastName: 'Murphy' }, { firstName: 'Wallace', lastName: 'Battle' }, { firstName: 'Preston', lastName: 'Jones' }, { firstName: 'Warren', lastName: 'Alston' }, { firstName: 'Amir', lastName: 'Contreras' }, { firstName: 'Ursula', lastName: 'Sargent' }, { firstName: 'Castor', lastName: 'Hobbs' }, { firstName: 'Noelani', lastName: 'Campbell' }, { firstName: 'Buffy', lastName: 'Warren' }, { firstName: 'Althea', lastName: 'Burnett' }, { firstName: 'Justin', lastName: 'Hopper' }, { firstName: 'Allegra', lastName: 'Randolph' }, { firstName: 'Jolie', lastName: 'Quinn' }, { firstName: 'Abel', lastName: 'Britt' }, { firstName: 'Joel', lastName: 'Carroll' }, { firstName: 'Clarke', lastName: 'Bradley' }, { firstName: 'Abigail', lastName: 'Bernard' }, { firstName: 'Natalie', lastName: 'Dillon' }, { firstName: 'Baxter', lastName: 'Glover' }, { firstName: 'Burton', lastName: 'Wall' }, { firstName: 'Hu', lastName: 'Sellers' }, { firstName: 'Brielle', lastName: 'Farley' }, { firstName: 'Chancellor', lastName: 'Clayton' }, { firstName: 'Kermit', lastName: 'Powers' }, { firstName: 'Otto', lastName: 'Love' }, { firstName: 'Blaine', lastName: 'Palmer' }, { firstName: 'Ignatius', lastName: 'Butler' }, { firstName: 'Teegan', lastName: 'Sweeney' }, { firstName: 'Cruz', lastName: 'Talley' }, { firstName: 'Daphne', lastName: 'Byrd' }, { firstName: 'Jana', lastName: 'Frazier' }, { firstName: 'Cathleen', lastName: 'Benjamin' }, { firstName: 'Kylie', lastName: 'Campos' }, { firstName: 'Cedric', lastName: 'George' }, { firstName: 'Callie', lastName: 'Holmes' }, { firstName: 'Troy', lastName: 'Foreman' }, { firstName: 'Eaton', lastName: 'Snyder' }, { firstName: 'Holmes', lastName: 'Peters' }, { firstName: 'Zoe', lastName: 'Moon' }, { firstName: 'Samson', lastName: 'Nielsen' }, { firstName: 'Avye', lastName: 'Brennan' }, { firstName: 'Vera', lastName: 'Hale' }, { firstName: 'Rina', lastName: 'Lancaster' }, { firstName: 'Vincent', lastName: 'Kane' }, { firstName: 'John', lastName: 'Salas' }, { firstName: 'Orla', lastName: 'Frost' }, { firstName: 'James', lastName: 'Fitzgerald' }, { firstName: 'Uma', lastName: 'Rush' }, { firstName: 'Ria', lastName: 'Austin' }, { firstName: 'Armando', lastName: 'Middleton' }, { firstName: 'Tatiana', lastName: 'Holden' }, { firstName: 'Jenette', lastName: 'Beach' }, { firstName: 'Penelope', lastName: 'Pena' }, { firstName: 'Ashton', lastName: 'Rollins' }, { firstName: 'Otto', lastName: 'Osborn' }, { firstName: 'Charlotte', lastName: 'Horton' }, { firstName: 'Janna', lastName: 'Mendoza' }, { firstName: 'Aaron', lastName: 'Strickland' }, { firstName: 'Nayda', lastName: 'Martinez' }, { firstName: 'Regina', lastName: 'Schwartz' }, { firstName: 'Zahir', lastName: 'Beach' }, { firstName: 'Ramona', lastName: 'Kerr' }, { firstName: 'Hiroko', lastName: 'Hartman' }, { firstName: 'Troy', lastName: 'Hodge' }, { firstName: 'Adria', lastName: 'Brady' }, { firstName: 'Noel', lastName: 'Rollins' } ];
		numUsers = data.length +2;

		// Remove old previous data
		User.remove(function(err) {
			if (err) console.error(err);

			user.save(function(err) {
				if (err) console.error(err);

				admin.save(function(err) {
					// 1st para in async.each() is the array of items
					// 2nd param is the function that each item is passed to
					async.each (data, function(data, callback) {
						username = _.deburr(data.firstName.charAt(0) + data.lastName).toLowerCase();

						new User({
							firstName: data.firstName,
							lastName: data.lastName,
							email: username + '@example.net',
							username: username,
							password: crypto.randomBytes(16).toString('base64'),
							provider: 'local',
							roles: ['user']
						}).save(callback);
					},
					// 3rd param is the function to call when everything's done
					function(err) {
						if (err) console.error(err);

						done();
					});
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


	it('NU_P_G001_E201: should be able to get the first page of the list of Users', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 25; // default

				// Get a list of Users
				agent.get('/api/v1/users')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');
						users.should.have.propertyByPath('_links', 'next');
						users.should.have.propertyByPath('_links', 'last');

						(users._embedded.users).should.be.an.Array.with.lengthOf(limit);

						// Check users in user list
						(users._embedded.users[0]).should.have.properties('_id', 'name', 'username', '_links');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'self', 'href');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'avatar', 'href');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E202: should be able to select the first page of the list of Users', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 10,
					page = 1;

				// Get a list of Users
				agent.get('/api/v1/users')
					.query({ page: page, limit: limit })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');
						users.should.have.propertyByPath('_links', 'next');
						users.should.have.propertyByPath('_links', 'last');
						users.should.not.have.propertyByPath('_links', 'first');
						users.should.not.have.propertyByPath('_links', 'prev');

						(users._links.self.href).should.containEql('page=1');
						(users._links.next.href).should.containEql('page=2');
						(users._links.last.href).should.containEql('page='+ Math.ceil(numUsers/limit) );

						(users._embedded.users).should.be.an.Array.with.lengthOf(limit);

						// Check users in user list
						(users._embedded.users[0]).should.have.properties('_id', 'name', 'username', '_links');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'self', 'href');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'avatar', 'href');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E203: should be able to select the second page of the list of Users', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 20,
					page = 2;

				// Get a list of Users
				agent.get('/api/v1/users')
					.query({ page: page, limit: limit })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');
						users.should.have.propertyByPath('_links', 'next');
						users.should.have.propertyByPath('_links', 'last');
						users.should.have.propertyByPath('_links', 'first');
						users.should.have.propertyByPath('_links', 'prev');

						(users._links.self.href).should.containEql('page=2');
						(users._links.first.href).should.containEql('page=1');
						(users._links.prev.href).should.containEql('page=1');
						(users._links.next.href).should.containEql('page=3');
						(users._links.last.href).should.containEql('page='+ Math.ceil(numUsers/limit) );

						(users._embedded.users).should.be.an.Array.with.lengthOf(limit);

						// Check users in user list
						(users._embedded.users[0]).should.have.properties('_id', 'name', 'username', '_links');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'self', 'href');
						(users._embedded.users[0]).should.have.propertyByPath('_links', 'avatar', 'href');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E204: should be able to navigate to the last page of the list of Users', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 10,
					page = 1,
					selUser;

				// Get the first page of the list of Users
				agent.get('/api/v1/users')
					.query({ page: page, limit: limit })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Set assertions
						(usersGetRes.body).should.be.an.Object.not.be.empty;
						(usersGetRes.body).should.have.propertyByPath('_links', 'last');

						selUser = (usersGetRes.body._embedded.users[0].username);

						// Get the last page of the list of Users
						agent.get(usersGetRes.body._links.last.href)
							.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
							.end(function(users2GetErr, users2GetRes) {

								// Get users list
								var users = users2GetRes.body;

								// Set assertions
								users.should.be.an.Object.not.be.empty;
								users.should.have.propertyByPath('_links', 'self');
								users.should.have.propertyByPath('_links', 'first');
								users.should.have.propertyByPath('_links', 'prev');
								users.should.not.have.propertyByPath('_links', 'next');
								users.should.not.have.propertyByPath('_links', 'last');

								(users._links.self.href).should.containEql(usersGetRes.body._links.last.href);
								(users._links.first.href).should.containEql('page=1');

								(users._links.prev.href).should.containEql('page='+ parseInt(Math.ceil(numUsers/limit)-1) );

								(users._embedded.users).should.be.an.Array;
								(users._embedded.users.length).should.be.lessThan(limit +1);

								(users._embedded.users[0].username).should.not.match(selUser);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G001_E205: should be able to order the list by username', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 25; // default

				// Get the first page of the list of Users
				agent.get('/api/v1/users')
					.query({ sort: 'username' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');
						users.should.have.propertyByPath('_links', 'next');
						users.should.have.propertyByPath('_links', 'last');

						users.should.not.have.propertyByPath('_links', 'first');
						users.should.not.have.propertyByPath('_links', 'prev');

						(users._links.self.href).should.containEql('sort=username');
						(users._links.next.href).should.containEql('sort=username');
						(users._links.last.href).should.containEql('sort=username');

						(users._embedded.users).should.be.an.Array.with.length(limit);

						(users._embedded.users[0].username).should.match('abernard');
						(users._embedded.users[1].username).should.match('abrady');
						(users._embedded.users[23].username).should.match('cclayton');
						(users._embedded.users[24].username).should.match('cdavidson');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E206: should be able to order the list by username in descending order', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 25; // default

				// Get the first page of the list of Users
				agent.get('/api/v1/users')
					.query({ sort: '-username' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');
						users.should.have.propertyByPath('_links', 'next');
						users.should.have.propertyByPath('_links', 'last');

						users.should.not.have.propertyByPath('_links', 'first');
						users.should.not.have.propertyByPath('_links', 'prev');

						(users._links.self.href).should.containEql('sort=-username');
						(users._links.next.href).should.containEql('sort=-username');
						(users._links.last.href).should.containEql('sort=-username');

						(users._embedded.users).should.be.an.Array.with.length(limit);

						(users._embedded.users[0].username).should.match('zmoon');
						(users._embedded.users[1].username).should.match('zbeach');
						(users._embedded.users[23].username).should.match('rlancaster');
						(users._embedded.users[24].username).should.match('rkerr');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G001_E207: should be able to select the second page of the sorted list of Users', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 5,
					page = 2,
					sort = '-username';

				// Get a list of Users
				agent.get('/api/v1/users')
					.query({ page: page, limit: limit, sort: sort })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(usersGetErr, usersGetRes) {
						// Handle User save error
						if (usersGetErr) done(usersGetErr);

						// Get users list
						var users = usersGetRes.body;

						// Set assertions
						users.should.be.an.Object.not.be.empty;
						users.should.have.propertyByPath('_links', 'self');
						users.should.have.propertyByPath('_links', 'next');
						users.should.have.propertyByPath('_links', 'last');
						users.should.have.propertyByPath('_links', 'first');
						users.should.have.propertyByPath('_links', 'prev');

						(users._links.self.href).should.containEql('page=2').with.containEql('sort=-username');
						(users._links.first.href).should.containEql('page=1').with.containEql('sort=-username');
						(users._links.prev.href).should.containEql('page=1').with.containEql('sort=-username');
						(users._links.next.href).should.containEql('page=3').with.containEql('sort=-username');
						(users._links.last.href).should.containEql('page='+ Math.ceil(numUsers/limit) ).with.containEql('sort=-username');

						(users._embedded.users).should.be.an.Array.with.lengthOf(limit);

						(users._embedded.users[0].username).should.match('walston');
						(users._embedded.users[1].username).should.match('vkane');
						(users._embedded.users[2].username).should.match('vhale');
						(users._embedded.users[3].username).should.match('vfranklin');
						(users._embedded.users[4].username).should.match('username');

						// Call the assertion callback
						done();
					});
			});
	});

	afterEach(function(done) {
		agent.get('/auth/signout')
			.expect(302)
			.end(done);
	});

});