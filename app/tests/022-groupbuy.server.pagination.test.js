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
	Currency = mongoose.model('Currency'),
	Groupbuy = mongoose.model('Groupbuy'),
	agent    = request.agent(app);

/**
 * Globals
 */
var credentialsA, currency, admin, userData, groupbuyData, user, users = [], groupbuy, groupbuys = [];

/**
 * User routes tests
 */
describe('Groupbuy Pagination tests', function() {
	before(function(done) {
		var username, managers, members;
		currency = new Currency({
			name: 'Euro',
			code: 'EUR',
			symbol: '€',
			priority: 100
		});

		// Create user credentials
		credentialsA = {
			username: 'admin',
			password: 'passwordA'
		};

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

		// Generate 25 users
		userData = [ { firstName: 'Patience', lastName: 'Anthony' }, { firstName: 'Wanda', lastName: 'Simpson' }, { firstName: 'Christopher', lastName: 'Davidson' }, { firstName: 'Melissa', lastName: 'Hoover' }, { firstName: 'Blair', lastName: 'Miller' }, { firstName: 'Shelby', lastName: 'Odom' }, { firstName: 'Salvador', lastName: 'Singleton' }, { firstName: 'Yolanda', lastName: 'Petersen' }, { firstName: 'Clementine', lastName: 'Webb' }, { firstName: 'Sydnee', lastName: 'Mccarthy' }, { firstName: 'Garrett', lastName: 'Mcintosh' }, { firstName: 'Maite', lastName: 'Spencer' }, { firstName: 'Kaitlin', lastName: 'Delaney' }, { firstName: 'Dane', lastName: 'Booker' }, { firstName: 'Palmer', lastName: 'Barry' }, { firstName: 'Jamal', lastName: 'Best' }, { firstName: 'Vera', lastName: 'Franklin' }, { firstName: 'Portia', lastName: 'Ferrell' }, { firstName: 'Amaya', lastName: 'Downs' }, { firstName: 'Amity', lastName: 'Ewing' }, { firstName: 'Nadine', lastName: 'Church' }, { firstName: 'Libby', lastName: 'Griffith' }, { firstName: 'Laith', lastName: 'Flowers' }, { firstName: 'Trevor', lastName: 'Peters' }, { firstName: 'Graham', lastName: 'Lara' } ];
		// Generate 5 Groupbuys
		groupbuyData = [
			{ title: 'neque venenatis', managers: [23], members: [13, 7], description: 'eu tellus. Phasellus elit pede, malesuada vel, venenatis vel, faucibus id, libero. Donec consectetuer mauris id sapien. Cras dolor dolor, tempus non, lacinia at, iaculis quis, pede. Praesent eu dui. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Aenean eget magna. Suspendisse tristique neque venenatis lacus. Etiam bibendum fermentum metus. Aenean sed pede nec ante blandit viverra. Donec tempus, lorem fringilla ornare placerat, orci lacus vestibulum lorem, sit amet ultricies sem magna nec quam. Curabitur vel lectus. Cum sociis natoque penatibus et magnis'},
			{ title: 'Cursus et, magna.', managers: [12], members: [2, 4, 6, 8, 10, 14, 16, 18], description: 'tristique neque venenatis lacus. Etiam bibendum fermentum metus. Aenean sed pede nec ante blandit viverra. Donec tempus, lorem fringilla ornare placerat, orci lacus vestibulum lorem, sit amet ultricies sem magna nec quam. Curabitur vel lectus. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec dignissim magna a tortor. Nunc commodo auctor' },
			{ title: 'Dui lectus', managers: [23, 12, 7], members: [0, 2, 3, 4, 5, 6, 9], description: 'ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Phasellus ornare. Fusce mollis. Duis sit amet diam eu dolor egestas rhoncus. Proin nisl sem, consequat nec, mollis vitae, posuere at, velit. Cras lorem lorem, luctus ut, pellentesque eget, dictum placerat, augue. Sed' },
			{ title: 'Ultrices sit amet, risus.', managers: [23, 7, 8], members: [1], description: 'Praesent eu nulla at sem molestie sodales. Mauris blandit enim consequat purus. Maecenas libero est, congue a, aliquet vel, vulputate eu, odio. Phasellus at augue id ante dictum cursus. Nunc mauris elit, dictum eu, eleifend nec, malesuada ut, sem. Nulla interdum. Curabitur dictum. Phasellus in felis. Nulla tempor augue ac ipsum. Phasellus vitae mauris sit amet lorem semper auctor. Mauris' },
			{ title: 'Ut, pharetra', managers: [0], members: [], description: 'ultrices a, auctor non, feugiat nec, diam. Duis mi enim, condimentum eget, volutpat ornare, facilisis eget, ipsum. Donec sollicitudin adipiscing ligula. Aenean gravida nunc sed pede. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Proin vel arcu eu odio tristique pharetra. Quisque ac libero nec ligula consectetuer rhoncus. Nullam velit dui, semper et, lacinia vitae, sodales at, velit. Pellentesque ultricies dignissim lacus. Aliquam' }
		];


		// Remove old previous data
		Groupbuy.remove(function(err) {
			User.remove(function(err) {
				Currency.remove(function(err) {
					// Save test data
					currency.save(function(err) {
						if (err) console.error(err);

						admin.save(function(err) {
							if (err) console.error(err);

							users.push(admin);

							// 1st para in async.each() is the array of items
							// 2nd param is the function that each item is passed to
							async.each (userData, function(data, callback) {
								username = _.deburr(data.firstName.charAt(0) + data.lastName).toLowerCase();

								user = new User({
									firstName: data.firstName,
									lastName: data.lastName,
									email: username + '@example.net',
									username: username,
									password: crypto.randomBytes(16).toString('base64'),
									provider: 'local',
									roles: ['user']
								});
								user.save(callback);

								users.push(user);
							},
							// 3rd param is the function to call when everything's done
							function(err) {
								if (err) {
									console.error(err);
									done(err);
								}
							});

							// 1st para in async.each() is the array of items
							// 2nd param is the function that each item is passed to
							async.each (groupbuyData, function(data, callback) {
								managers = _.map(data.managers, function(n) {
									return users[n].id;
								});
								members  = _.union(managers, _.map(data.members, function(n) {
									return users[n].id;
								}) );

								groupbuy = new Groupbuy({
									title: data.title,
									description: data.description,
									managers: managers,
									members: members,
									user: managers[0]
								});
								groupbuy.save(callback);
								groupbuys.push(groupbuy);
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


	it('NU_P_G002_E201: should be able to get the first page of the list of Groupbuys', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 25; // default
				limit = (limit < groupbuys.length)? limit: groupbuys.length;

				// Get a list of Groupbuys
				agent.get('/api/v1/groupbuys')
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuys save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body).should.be.an.Object.not.be.empty;
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'prev');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'next');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'last');

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array.with.lengthOf(limit);

						// Check groupbuys
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.properties('_id', 'title', 'name', 'description', 'status');
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[0].status).should.match('new');

						(groupbuysGetRes.body._embedded.groupbuys[1]).should.have.properties('_id', 'title', 'name', 'description', 'status');
						(groupbuysGetRes.body._embedded.groupbuys[1]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[1].status).should.match('new');

						(groupbuysGetRes.body._embedded.groupbuys[2]).should.have.properties('_id', 'title', 'name', 'description', 'status');
						(groupbuysGetRes.body._embedded.groupbuys[2]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[2].status).should.match('new');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G002_E202: should be able to select the first page of the list of Groupbuys', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 3,
					page = 1;

				limit = (limit < groupbuys.length)? limit: groupbuys.length;

				// Get a list of Groupbuys
				agent.get('/api/v1/groupbuys')
					.query({ page: page, limit: limit })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuys save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body).should.be.an.Object.not.be.empty;
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'last', 'href');

						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'prev');

						(groupbuysGetRes.body._links.self.href).should.containEql('page=1');
						(groupbuysGetRes.body._links.next.href).should.containEql('page=2');
						(groupbuysGetRes.body._links.last.href).should.containEql('page='+ Math.ceil(groupbuys.length/limit) );

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array.with.lengthOf(limit);

						// Check groupbuys
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.properties('_id', 'title', 'name', 'description', 'status');
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[0].status).should.match('new');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G002_E203: should be able to select the second and last page of the list of Groupbuys', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 3,
					page = 2;

				limit = (limit < groupbuys.length)? limit: groupbuys.length;

				// Get a list of Groupbuys
				agent.get('/api/v1/groupbuys')
					.query({ page: page, limit: limit })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuys save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body).should.be.an.Object.not.be.empty;
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'first', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'prev', 'href');

						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'last');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'next');

						(groupbuysGetRes.body._links.self.href).should.containEql('page=2');
						(groupbuysGetRes.body._links.prev.href).should.containEql('page=1');
						(groupbuysGetRes.body._links.first.href).should.containEql('page=1');

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array;
						(groupbuysGetRes.body._embedded.groupbuys.length).should.be.lessThan(limit +1);

						// Check groupbuys
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.properties('_id', 'title', 'name', 'description', 'status');
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[0].status).should.match('new');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G002_E204: should be able to order the list by title (case-sensitive)', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 25; // default
				limit = (limit < groupbuys.length)? limit: groupbuys.length;

				// Get the first page of the list of Users
				agent.get('/api/v1/groupbuys')
					.query({ sort: 'title' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle User save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body).should.be.an.Object.not.be.empty;
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'prev');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'next');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'last');

						(groupbuysGetRes.body._links.self.href).should.containEql('sort=title');

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array;
						(groupbuysGetRes.body._embedded.groupbuys.length).should.be.lessThan(limit +1);

						(groupbuysGetRes.body._embedded.groupbuys[0].title).should.match('Cursus et, magna.');
						(groupbuysGetRes.body._embedded.groupbuys[1].title).should.match('Dui lectus');
						(groupbuysGetRes.body._embedded.groupbuys[2].title).should.match('Ultrices sit amet, risus.');
						(groupbuysGetRes.body._embedded.groupbuys[3].title).should.match('Ut, pharetra');
						(groupbuysGetRes.body._embedded.groupbuys[4].title).should.match('neque venenatis');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G002_E205: should be able to order the list by name (slug) ', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 25; // default
				limit = (limit < groupbuys.length)? limit: groupbuys.length;

				// Get the first page of the list of Users
				agent.get('/api/v1/groupbuys')
					.query({ sort: 'name' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuy save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body).should.be.an.Object.not.be.empty;
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'prev');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'next');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'last');

						(groupbuysGetRes.body._links.self.href).should.containEql('sort=name');

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array;
						(groupbuysGetRes.body._embedded.groupbuys.length).should.be.lessThan(limit +1);

						(groupbuysGetRes.body._embedded.groupbuys[0].title).should.match('Cursus et, magna.');
						(groupbuysGetRes.body._embedded.groupbuys[1].title).should.match('Dui lectus');
						(groupbuysGetRes.body._embedded.groupbuys[2].title).should.match('neque venenatis');
						(groupbuysGetRes.body._embedded.groupbuys[3].title).should.match('Ultrices sit amet, risus.');
						(groupbuysGetRes.body._embedded.groupbuys[4].title).should.match('Ut, pharetra');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G002_E206: should be able to select the second page of the descending sorted list of Groupbuys', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var limit = 2,
					page = 2,
					sort = '-name';

				// Get a list of Groupbuys
				agent.get('/api/v1/groupbuys')
					.query({ page: page, limit: limit, sort: sort })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuy save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body).should.be.an.Object.not.be.empty;
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'first', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'prev', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'last', 'href');

						(groupbuysGetRes.body._links.self.href).should.containEql('page=2').and.containEql('sort=-name');
						(groupbuysGetRes.body._links.first.href).should.containEql('page=1').and.containEql('sort=-name');
						(groupbuysGetRes.body._links.prev.href).should.containEql('page=1').and.containEql('sort=-name');
						(groupbuysGetRes.body._links.next.href).should.containEql('page=3').and.containEql('sort=-name');
						(groupbuysGetRes.body._links.last.href).should.containEql('page=3').and.containEql('sort=-name');

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array.with.lengthOf(limit);

						(groupbuysGetRes.body._embedded.groupbuys[0].title).should.match('neque venenatis');
						(groupbuysGetRes.body._embedded.groupbuys[1].title).should.match('Dui lectus');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G002_E207: should be able to filter and sort the list of Groupbuys by title', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get('/api/v1/groupbuys')
					.query({ filter: {title: 'su'}, sort: '-name' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuy save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body).should.be.an.Object.not.be.empty;
						(groupbuysGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'prev');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'next');
						(groupbuysGetRes.body).should.not.have.propertyByPath('_links', 'last');

						(groupbuysGetRes.body._links.self.href).should.containEql('filter%5Btitle%5D=su').and.containEql('sort=-name');

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array.with.lengthOf(2);

						(groupbuysGetRes.body._embedded.groupbuys[0].title).should.match('Ultrices sit amet, risus.');
						(groupbuysGetRes.body._embedded.groupbuys[1].title).should.match('Cursus et, magna.');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G002_E208: should be able to paginate the list of members of a Groupbuy', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get('/api/v1/groupbuys')
					.query({ filter: {title: 'Cursus et, magna.'} })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuy save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array.with.lengthOf(1);
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'members', 'href');

						// Get first page of list of members
						agent.get(groupbuysGetRes.body._embedded.groupbuys[0]._links.members.href)
							.query({limit: 5, page: 1, sort: 'username'})
							.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
							.end(function(groupbuyGetErr, groupbuyGetRes) {
								// Handle Groupbuy save error
								if (groupbuyGetErr) done(groupbuyGetErr);

								// Set assertions
								(groupbuyGetRes.body).should.be.an.Object.not.be.empty;
								(groupbuyGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
								(groupbuyGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
								(groupbuyGetRes.body).should.have.propertyByPath('_links', 'last', 'href');
								(groupbuyGetRes.body._links.self.href).should.containEql('page=1').and.containEql('sort=username');

								(groupbuyGetRes.body).should.have.propertyByPath('_embedded', 'members');
								(groupbuyGetRes.body._embedded.members).should.be.an.Array.with.lengthOf(5);

								(groupbuyGetRes.body._embedded.members[0].username).should.match('dbooker');
								(groupbuyGetRes.body._embedded.members[1].username).should.match('jbest');
								(groupbuyGetRes.body._embedded.members[2].username).should.match('mhoover');
								(groupbuyGetRes.body._embedded.members[3].username).should.match('mspencer');
								(groupbuyGetRes.body._embedded.members[4].username).should.match('pferrell');

								// Get the second page of list of members
								agent.get(groupbuyGetRes.body._links.next.href)
									.set('Accept', 'application/json')
									.expect('Content-Type', /json/)
									.expect(200)
									.end(function(groupbuyGetErr, groupbuyGetRes) {
										// Handle Groupbuy save error
										if (groupbuyGetErr) done(groupbuyGetErr);

										// Set assertions
										(groupbuyGetRes.body).should.be.an.Object.not.be.empty;
										(groupbuyGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
										(groupbuyGetRes.body).should.have.propertyByPath('_links', 'first', 'href');
										(groupbuyGetRes.body).should.have.propertyByPath('_links', 'prev', 'href');
										(groupbuyGetRes.body._links.self.href).should.containEql('page=2').and.containEql('sort=username');

										(groupbuyGetRes.body).should.have.propertyByPath('_embedded', 'members');
										(groupbuyGetRes.body._embedded.members).should.be.an.Array.with.lengthOf(4);

										(groupbuyGetRes.body._embedded.members[0].username).should.match('smccarthy');
										(groupbuyGetRes.body._embedded.members[1].username).should.match('sodom');
										(groupbuyGetRes.body._embedded.members[2].username).should.match('wsimpson');
										(groupbuyGetRes.body._embedded.members[3].username).should.match('ypetersen');

										// Call the assertion callback
										done();
									});
							});
					});
			});
	});

	it('NU_P_G002_E209: should be able to paginate the list of managers of a Groupbuy', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get('/api/v1/groupbuys')
					.query({ filter: {title: 'Dui lectus'} })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(groupbuysGetErr, groupbuysGetRes) {
						// Handle Groupbuy save error
						if (groupbuysGetErr) done(groupbuysGetErr);

						// Set assertions
						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array.with.lengthOf(1);
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'managers', 'href');

						// Get first page of list of managers
						agent.get(groupbuysGetRes.body._embedded.groupbuys[0]._links.managers.href)
							.query({limit: 2, page: 1, sort: '-username'})
							.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
							.end(function(groupbuyGetErr, groupbuyGetRes) {
								// Handle Groupbuy save error
								if (groupbuyGetErr) done(groupbuyGetErr);

								// Set assertions
								(groupbuyGetRes.body).should.be.an.Object.not.be.empty;
								(groupbuyGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
								(groupbuyGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
								(groupbuyGetRes.body).should.have.propertyByPath('_links', 'last', 'href');
								(groupbuyGetRes.body._links.self.href).should.containEql('page=1').and.containEql('sort=-username');

								(groupbuyGetRes.body).should.have.propertyByPath('_embedded', 'managers');
								(groupbuyGetRes.body._embedded.managers).should.be.an.Array.with.lengthOf(2);

								(groupbuyGetRes.body._embedded.managers[0].username).should.match('ssingleton');
								(groupbuyGetRes.body._embedded.managers[1].username).should.match('mspencer');

								// Get the second page of list of managers
								agent.get(groupbuyGetRes.body._links.next.href)
									.set('Accept', 'application/json')
									.expect('Content-Type', /json/)
									.expect(200)
									.end(function(groupbuyGetErr, groupbuyGetRes) {
										// Handle Groupbuy save error
										if (groupbuyGetErr) done(groupbuyGetErr);

										// Set assertions
										(groupbuyGetRes.body).should.be.an.Object.not.be.empty;
										(groupbuyGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
										(groupbuyGetRes.body).should.have.propertyByPath('_links', 'first', 'href');
										(groupbuyGetRes.body).should.have.propertyByPath('_links', 'prev', 'href');
										(groupbuyGetRes.body._links.self.href).should.containEql('page=2').and.containEql('sort=-username');

										(groupbuyGetRes.body).should.have.propertyByPath('_embedded', 'managers');
										(groupbuyGetRes.body._embedded.managers).should.be.an.Array.with.lengthOf(1);

										(groupbuyGetRes.body._embedded.managers[0].username).should.match('lflowers');

										// Call the assertion callback
										done();
									});
							});
					});
			});
	});


	afterEach(function(done) {
		agent.get('/api/v1/auth/signout')
			.expect(302)
			.end(done);
	});

});