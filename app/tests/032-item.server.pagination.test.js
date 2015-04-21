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
	Item     = mongoose.model('Item'),
	agent    = request.agent(app);

/**
 * Globals
 */
var credentialsA, currency, admin, userData, itemData, user, users = [], groupbuy, item, items = [], itemsURL;

/**
 * User routes tests
 */
describe('Item Pagination tests', function() {
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

		// Generate 10 users
		userData = [ { firstName: 'Patience', lastName: 'Anthony' }, { firstName: 'Wanda', lastName: 'Simpson' }, { firstName: 'Christopher', lastName: 'Davidson' }, { firstName: 'Melissa', lastName: 'Hoover' }, { firstName: 'Blair', lastName: 'Miller' }, { firstName: 'Shelby', lastName: 'Odom' }, { firstName: 'Salvador', lastName: 'Singleton' }, { firstName: 'Yolanda', lastName: 'Petersen' }, { firstName: 'Clementine', lastName: 'Webb' }, { firstName: 'Sydnee', lastName: 'Mccarthy' } ];

		// Generate 13 Items
		itemData = [
			{title: 'Alemania (1 ceca)' , description: 'St. Andrew\'s Church, Lower Saxony (ceca aleatoria)', price: 2.24},
			{title: 'Alemania (5 cecas)' , description: 'St. Andrew\'s Church, Lower Saxony', price: 11.2},
			{title: 'Bélgica 1' , description: '100 años comienzo 1ª Guerra Mundial', price: 2.18},
			{title: 'Bélgica 2' , description: '150 años de la Cruz Roja (coincard)', price: 8.15},
			{title: 'Francia 1' , description: '70 aniv del Día D', price:2.54},
			{title: 'Francia 2' , description: 'Día internacional del SIDA', price: 2.46},
			{title: 'Eslovaquia' , description: '10 años en la UE', price: 2.32},
			{title: 'Eslovenia' , description: '600 aniv coronación de Barbara de Celje', price: 2.34},
			{title: 'España 1' , description: 'Park Güell', price: 2.00},
			{title: 'España 2' , description: 'Cambio de trono', price: 2.00},
			{title: 'Finlandia 1' , description: 'Centenario del nacimiento de Tove Jansson', price: 2.43},
			{title: 'Finlandia 2' , description: 'Centenario del nacimiento de Ilmari Tapiovaara', price: 2.41},
			{title: 'Letonia' , description: 'Riga, capital europea de la cultura', price: 2.6}
		];

		// Remove old previous data
		Item.remove(function(err) {
			if (err) console.error(err);

			Groupbuy.remove(function(err) {
				if (err) console.error(err);

				User.remove(function(err) {
					if (err) console.error(err);

					Currency.remove(function(err) {
						if (err) console.error(err);

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

								// Generate 1 Groupbuy
								managers = _.map([1, 2], function(n) {
									return users[n].id;
								});
								members  = _.union(managers, _.map([3, 4, 5, 6, 7, 8, 9, 10], function(n) {
									return users[n].id;
								}) );

								groupbuy = new Groupbuy({
									title: 'Compra en grupo 2€ CC 2014',
									description: 'Compra de lasmonedas de 2€ emitidas durante el año 2014',
									managers: managers,
									members: members,
									user: managers[0]
								});
								groupbuy.save(function(err) {

									// 1st para in async.each() is the array of items
									// 2nd param is the function that each item is passed to
									async.each (itemData, function(data, callback) {
										item = new Item({
											title:       data.title,
											description: data.description,
											price:       data.price,
											groupbuy:    groupbuy.id,
											user:        _.sample(managers)
										});
										item.save(callback);
										items.push(item);
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


	it('NU_P_G003_E201: should be able to get the first page of the list of Items in a Groupbuy', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

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

						(groupbuysGetRes.body._embedded.groupbuys).should.be.an.Array.with.lengthOf(1);

						// Check groupbuys
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.properties('_id', 'title', 'name', 'description', 'status');
						(groupbuysGetRes.body._embedded.groupbuys[0]).should.have.propertyByPath('_links', 'self', 'href');
						(groupbuysGetRes.body._embedded.groupbuys[0].status).should.match('new');
						(groupbuysGetRes.body._embedded.groupbuys[0].title).should.match('Compra en grupo 2€ CC 2014');
						(groupbuysGetRes.body._embedded.groupbuys[0].description).should.match('Compra de lasmonedas de 2€ emitidas durante el año 2014');

						// Save items URL for later
						itemsURL = groupbuysGetRes.body._embedded.groupbuys[0]._links.items.href;

						// Get the list of items
						agent.get(itemsURL)
							.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
							.end(function(itemsGetErr, itemsGetRes) {
								// Handle Items get error
								if (itemsGetErr) done(itemsGetErr);

								// Set assertions
								(itemsGetRes.body).should.be.an.Object.not.be.empty;
								(itemsGetRes.body).should.not.have.propertyByPath('_links', 'first');
								(itemsGetRes.body).should.not.have.propertyByPath('_links', 'prev');
								(itemsGetRes.body).should.not.have.propertyByPath('_links', 'next');
								(itemsGetRes.body).should.not.have.propertyByPath('_links', 'last');

								(itemsGetRes.body).should.have.propertyByPath('_embedded', 'items');
								(itemsGetRes.body._embedded.items).should.be.an.Array.with.lengthOf(13);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G003_E202: should be able to filter items in a Groupbuy', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the list of items
				agent.get(itemsURL)
					.query({ filter: {title: '/España/'} })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(itemsGetErr, itemsGetRes) {
						// Handle Items get error
						if (itemsGetErr) done(itemsGetErr);

						// Set assertions
						(itemsGetRes.body).should.be.an.Object.not.be.empty;
						(itemsGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'prev');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'next');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'last');

						(itemsGetRes.body).should.have.propertyByPath('_embedded', 'items');
						(itemsGetRes.body._embedded.items).should.be.an.Array.with.lengthOf(2);

						(itemsGetRes.body._embedded.items[0].title).should.containEql('España ');
						(itemsGetRes.body._embedded.items[1].title).should.containEql('España ');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G003_E203: should be able to paginate and sort the list of items in a Groupbuy', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get(itemsURL)
					.query({ page: 1, limit: 5, sort: 'title' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(itemsGetErr, itemsGetRes) {
						// Handle Items get error
						if (itemsGetErr) done(itemsGetErr);

						// Set assertions
						(itemsGetRes.body).should.be.an.Object.not.be.empty;
						(itemsGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'last', 'href');

						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'prev');

						(itemsGetRes.body._links.self.href).should.containEql('page=1').and.containEql('sort=title').and.containEql('limit=5');

						(itemsGetRes.body).should.have.propertyByPath('_embedded', 'items');
						(itemsGetRes.body._embedded.items).should.be.an.Array.with.lengthOf(5);

						(itemsGetRes.body._embedded.items[0].title).should.match('Alemania (1 ceca)');
						(itemsGetRes.body._embedded.items[1].title).should.match('Alemania (5 cecas)');
						(itemsGetRes.body._embedded.items[2].title).should.match('Bélgica 1');
						(itemsGetRes.body._embedded.items[3].title).should.match('Bélgica 2');
						(itemsGetRes.body._embedded.items[4].title).should.match('Eslovaquia');

						// Get the last page of list of items
						agent.get(itemsGetRes.body._links.last.href)
							.set('Accept', 'application/json')
							.expect('Content-Type', /json/)
							.expect(200)
							.end(function(items2GetErr, items2GetRes) {
								// Handle Groupbuy save error
								if (items2GetErr) done(items2GetErr);

								// Set assertions
								(items2GetRes.body).should.be.an.Object.not.be.empty;
								(items2GetRes.body).should.have.propertyByPath('_links', 'self', 'href');
								(items2GetRes.body).should.have.propertyByPath('_links', 'first', 'href');
								(items2GetRes.body).should.have.propertyByPath('_links', 'prev', 'href');

								(items2GetRes.body).should.not.have.propertyByPath('_links', 'next');
								(items2GetRes.body).should.not.have.propertyByPath('_links', 'last');

								(items2GetRes.body._links.self.href).should.containEql('page=3').and.containEql('sort=title').and.containEql('limit=5');

								(items2GetRes.body).should.have.propertyByPath('_embedded', 'items');
								(items2GetRes.body._embedded.items).should.be.an.Array.with.lengthOf(3);

								(items2GetRes.body._embedded.items[0].title).should.match('Francia 1');
								(items2GetRes.body._embedded.items[1].title).should.match('Francia 2');
								(items2GetRes.body._embedded.items[2].title).should.match('Letonia');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G003_E204: should be able to sort the list of items by title in descending order', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get(itemsURL)
					.query({ page: 1, limit: 5, sort: '-title' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(itemsGetErr, itemsGetRes) {
						// Handle Items get error
						if (itemsGetErr) done(itemsGetErr);

						// Set assertions
						(itemsGetRes.body).should.be.an.Object.not.be.empty;
						(itemsGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'last', 'href');

						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'prev');

						(itemsGetRes.body._links.self.href).should.containEql('page=1').and.containEql('sort=-title').and.containEql('limit=5');

						(itemsGetRes.body).should.have.propertyByPath('_embedded', 'items');
						(itemsGetRes.body._embedded.items).should.be.an.Array.with.lengthOf(5);


						(itemsGetRes.body._embedded.items[0].title).should.match('Letonia');
						(itemsGetRes.body._embedded.items[1].title).should.match('Francia 2');
						(itemsGetRes.body._embedded.items[2].title).should.match('Francia 1');
						(itemsGetRes.body._embedded.items[3].title).should.match('Finlandia 2');
						(itemsGetRes.body._embedded.items[4].title).should.match('Finlandia 1');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G003_E205: should be able to sort the list of items by price in descending order', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get(itemsURL)
					.query({ sort: '-price' })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(itemsGetErr, itemsGetRes) {
						// Handle Items get error
						if (itemsGetErr) done(itemsGetErr);

						// Set assertions
						(itemsGetRes.body).should.be.an.Object.not.be.empty;
						(itemsGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'prev');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'next');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'last');

						(itemsGetRes.body._links.self.href).should.containEql('sort=-price');

						(itemsGetRes.body).should.have.propertyByPath('_embedded', 'items');
						(itemsGetRes.body._embedded.items).should.be.an.Array.with.lengthOf(13);


						(itemsGetRes.body._embedded.items[0].title).should.match('Alemania (5 cecas)');
						(itemsGetRes.body._embedded.items[0].price).should.match(11.2);

						(itemsGetRes.body._embedded.items[1].title).should.match('Bélgica 2');
						(itemsGetRes.body._embedded.items[1].price).should.match(8.15);

						(itemsGetRes.body._embedded.items[2].title).should.match('Letonia');
						(itemsGetRes.body._embedded.items[2].price).should.match(2.6);

						(itemsGetRes.body._embedded.items[3].title).should.match('Francia 1');
						(itemsGetRes.body._embedded.items[3].price).should.match(2.54);

						(itemsGetRes.body._embedded.items[4].title).should.match('Francia 2');
						(itemsGetRes.body._embedded.items[4].price).should.match(2.46);

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G003_E206: should be able to sort the list of items by price and title', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get(itemsURL)
					.query({ sort: 'price,title', limit: 5 })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(itemsGetErr, itemsGetRes) {
						// Handle Items get error
						if (itemsGetErr) done(itemsGetErr);

						// Set assertions
						(itemsGetRes.body).should.be.an.Object.not.be.empty;
						(itemsGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'last', 'href');

						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'prev');

						(itemsGetRes.body._links.self.href).should.containEql('sort=price%2Ctitle');

						(itemsGetRes.body).should.have.propertyByPath('_embedded', 'items');
						(itemsGetRes.body._embedded.items).should.be.an.Array.with.lengthOf(5);


						(itemsGetRes.body._embedded.items[0].title).should.match('España 1');
						(itemsGetRes.body._embedded.items[0].price).should.match(2.00);

						(itemsGetRes.body._embedded.items[1].title).should.match('España 2');
						(itemsGetRes.body._embedded.items[1].price).should.match(2.00);

						(itemsGetRes.body._embedded.items[2].title).should.match('Bélgica 1');
						(itemsGetRes.body._embedded.items[2].price).should.match(2.18);

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G003_E207: should be able to sort the list of items by price (ASC) and title (DESC)', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Groupbuys
				agent.get(itemsURL)
					.query({ sort: 'price,-title', limit: 5 })
					.set('Accept', 'application/json')
					.expect('Content-Type', /json/)
					.expect(200)
					.end(function(itemsGetErr, itemsGetRes) {
						// Handle Items get error
						if (itemsGetErr) done(itemsGetErr);

						// Set assertions
						(itemsGetRes.body).should.be.an.Object.not.be.empty;
						(itemsGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'next', 'href');
						(itemsGetRes.body).should.have.propertyByPath('_links', 'last', 'href');

						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'first');
						(itemsGetRes.body).should.not.have.propertyByPath('_links', 'prev');

						(itemsGetRes.body._links.self.href).should.containEql('sort=price%2C-title');

						(itemsGetRes.body).should.have.propertyByPath('_embedded', 'items');
						(itemsGetRes.body._embedded.items).should.be.an.Array.with.lengthOf(5);


						(itemsGetRes.body._embedded.items[0].title).should.match('España 2');
						(itemsGetRes.body._embedded.items[0].price).should.match(2.00);

						(itemsGetRes.body._embedded.items[1].title).should.match('España 1');
						(itemsGetRes.body._embedded.items[1].price).should.match(2.00);

						(itemsGetRes.body._embedded.items[2].title).should.match('Bélgica 1');
						(itemsGetRes.body._embedded.items[2].price).should.match(2.18);

						// Call the assertion callback
						done();
					});
			});
	});


	afterEach(function(done) {
		agent.get('/api/v1/auth/signout')
			.expect(302)
			.end(done);
	});

});