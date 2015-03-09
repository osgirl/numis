'use strict';

var should   = require('should'),
	request  = require('supertest'),
	app      = require('../../server'),
	mongoose = require('mongoose'),
	User 	 = mongoose.model('User'),
	Currency = mongoose.model('Currency'),
	Groupbuy = mongoose.model('Groupbuy'),
	Item     = mongoose.model('Item'),
	Order    = mongoose.model('Order'),
	agent    = request.agent(app);

/**
 * Globals
 */
var credentialsA, credentials1, credentials2, credentials3;
var admin, manager1, manager2, member3;
var currency, groupbuy, order, item1, item2, item3;
var request1, request2, request3;

/**
 * Order routes tests
 */
describe('Order CRUD tests', function() {
	before(function(done) {
		currency = new Currency({
			name: 'Euro',
			code: 'EUR',
			symbol: '€',
			priority: 100
		});

		// Remove old previous data
		Currency.remove().exec(function(err) {
			if (err) console.error(err);

			currency.save(function(err) {
				if (err) console.error(err);

				done();
			});
		});
	});

	beforeEach(function(done) {
		// Create managers credentials
		credentialsA = {
			username: 'admin1',
			password: 'password'
		};

		credentials1 = {
			username: 'manager1',
			password: 'password'
		};

		credentials2 = {
			username: 'manager2',
			password: 'password2'
		};

		// Create member credentials
		credentials3 = {
			username: 'member3',
			password: 'password3'
		};

		// Create new users
		admin = new User({
			firstName: 'Admin',
			lastName: '1',
			displayName: 'Admin 1',
			email: 'admin@example.net',
			username: credentialsA.username,
			password: credentialsA.password,
			provider: 'local',
			roles: ['admin']
		});

		manager1 = new User({
			firstName: 'Manager',
			lastName: '1',
			displayName: 'Manager 1',
			email: 'manager1@example.net',
			username: credentials1.username,
			password: credentials1.password,
			provider: 'local'
		});

		manager2 = new User({
			firstName: 'Manager',
			lastName: '2',
			displayName: 'Manager 2',
			email: 'manager2@example.net',
			username: credentials2.username,
			password: credentials2.password,
			provider: 'local'
		});

		member3 = new User({
			firstName: 'Member',
			lastName: '3',
			email: 'member3@example.net',
			username: credentials3.username,
			password: credentials3.password,
			provider: 'local'
		});

		// Remove old previous data
		Order.remove(function(err) {
			if (err) console.error(err);

			Item.remove(function(err) {
				if (err) console.error(err);

				Groupbuy.remove(function(err) {
					if (err) console.error(err);

					User.remove(function(err) {
						if (err) console.error(err);

						// Save test data
						admin.save(function(err) {
							if (err) console.error(err);

							manager1.save(function(err) {
								if (err) console.error(err);

								manager2.save(function(err) {
									if (err) console.error(err);

									// Create groupbuy and items to add on it
									groupbuy = new Groupbuy({
										title: 'Groupbuy #1',
										description: 'Lorem ipsum dolor sit amet...',
										members: [manager1.id],
										managers: [manager1.id],
										user: manager1
									});

									member3.save(function(err) {
										if (err) console.error(err);

										groupbuy.save(function(err) {
											if (err) console.error(err);

											item1 = new Item({
												title: 'Item 1',
												description: 'Description 1',
												price: 100,
												currency: currency.id,
												user: manager1,
												groupbuy: groupbuy
											});

											item2 = new Item({
												title: 'Item 2',
												description: 'Description 2',
												price: 10,
												user: manager1,
												groupbuy: groupbuy
											});

											// Create one Item to Groupbuy 2
											item3 = new Item({
												title: 'Item 3',
												description: 'Description 3',
												price: 1,
												user: manager2,
												groupbuy: groupbuy
											});

											item1.save(function(err) {
												if (err) console.error(err);

												item2.save(function(err) {
													if (err) console.error(err);

													item3.save(function(err) {
														if (err) console.error(err);

														request1 = {
															items: [
																{item: item1.id, quantity: 1},
																{item: item2.id, quantity: 1}
															]
														};

														request2 = {
															items: [
																{item: item1.id, quantity: 4},
																{item: item2.id, quantity: 4},
																{item: item3.id, quantity: 5}
															]
														};

														request3 = {
															items: [
																{item: item1.id, quantity: -3},
																{item: item2.id, quantity: -3},
																{item: item3.id, quantity: -3}
															]
														};

														order = new Order({
															groupbuy: groupbuy,
															user: manager1.id
														});

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


	it('NU_P_G004_E101: should be able to save Order instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials3)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Order
				agent.post('/api/v1/orders')
					.send(order)
					.expect(201)
					.end(function(orderSaveErr, orderSaveRes) {
						// Handle Order save error
						if (orderSaveErr) done(orderSaveErr);

						(orderSaveRes.body).should.have.properties('_id', '_links');
						(orderSaveRes.body).should.have.properties({
																total: 0,
																otherCosts: 0,
																shippingCost: 0,
																subtotal: 0,
																summary: [],
																requests: []
						});

						// Get an order
						agent.get(orderSaveRes.body._links.self.href)
							.expect(200)
							.end(function(orderGetErr, orderGetRes) {
								// Handle Order save error
								if (orderGetErr) done(orderGetErr);

								// Set message assertion
								orderGetRes.body.should.have.properties({
																	total: 0,
																	otherCosts: 0,
																	shippingCost: 0,
																	subtotal: 0,
																	summary: [],
																	requests: []
								});

								(orderGetRes.body._links).should.match(orderSaveRes.body._links);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G004_E102: should not be able to save Order instance if not logged in', function(done) {
		agent.post('/api/v1/orders')
			.send(order)
			.expect(401)
			.end(function(orderSaveErr, orderSaveRes) {
				// Call the assertion callback
				(orderSaveRes.body.name).should.match('NotLogged');

				done(orderSaveErr);
			});
	});

	it('NU_P_G004_E103: should be able to save Order instance if no user is provided', function(done) {
		// Invalidate user field
		order.user = null;

		agent.post('/auth/signin')
			.send(credentials1)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = manager1.id;

				// Save a new Order
				agent.post('/api/v1/orders')
					.send(order)
					.expect(201)
					.end(function(orderSaveErr, orderSaveRes) {
						// Set message assertion
						(orderSaveRes.body).should.have.properties('_id', '_links');
						(orderSaveRes.body._links.user.href).should.containEql(userId);

						// Handle Order save error
						done(orderSaveErr);
					});
			});
	});

	it('NU_P_G004_E104: should not be able to save Order instance if no groupbuy is provided', function(done) {
		// Invalidate user field
		order.groupbuy = null;

		agent.post('/auth/signin')
			.send(credentials1)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Order
				agent.post('/api/v1/orders')
					.send(order)
					.expect(400)
					.end(function(orderSaveErr, orderSaveRes) {
						// Set message assertion
						(orderSaveRes.body.name).should.match('ValidationError');
						(orderSaveRes.body.errors.groupbuy.path).should.match('groupbuy');
						(orderSaveRes.body.errors.groupbuy.type).should.match('required');
						(orderSaveRes.body.errors.groupbuy.message).should.match('You must select a groupbuy.');

						// Handle Order save error
						done(orderSaveErr);
					});
			});
	});

	it('NU_P_G004_E105: should not be able to update user or groupbuy in an existing Order instance', function(done) {
		// Login member3
		agent.post('/auth/signin')
			.send(credentials3)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Order
				agent.post('/api/v1/orders')
					.send(order)
					.expect(201)
					.end(function(orderSaveErr, orderSaveRes) {
						// Handle Order save error
						if (orderSaveErr) done(orderSaveErr);

						// User in order must be signed user.
						(orderSaveRes.body).should.have.properties('_id', '_links');
						(orderSaveRes.body._links.user.href).should.containEql(member3.id);

						// Update Order user
						order.user = member3.id;

						// Update Order groupbuy
						var groupbuy2 = new Groupbuy({
							title: 'Groupbuy #2',
							description: '...'
						});
						groupbuy2.save(function() {
							order.groupbuy = groupbuy2.id;
						});

						// Update other Order fields
						order.subtotal = 100;
						order.shippingCost = 100;
						order.otherCosts = 99;
						order.total = 12;

						// Update existing Order
						agent.put('/api/v1/orders/' + orderSaveRes.body._id)
							.send(order)
							.expect(204)
							.end(function(orderUpdateErr, orderUpdateRes) {
								// Handle Order update error
								if (orderUpdateErr) done(orderUpdateErr);

								agent.get('/api/v1/orders/' + orderSaveRes.body._id)
									.expect(200)
									.end(function(orderGetErr, orderGetRes) {
										// Handle Order update error
										if (orderGetErr) done(orderGetErr);

										// Set assertions
										(orderGetRes.body).should.have.properties('_id', '_links');
										(orderGetRes.body._id).should.equal(orderSaveRes.body._id);
										(orderGetRes.body._links.user.href).should.containEql(member3.id);
										(orderGetRes.body._links.groupbuy.href).should.containEql(groupbuy.id);
										// Non-updatable fields
										(orderGetRes.body.subtotal).should.equal(orderSaveRes.body.subtotal);
										(orderGetRes.body.total).should.equal(orderSaveRes.body.total);
										// Updtable fields
										(orderGetRes.body.shippingCost).should.equal(order.shippingCost);
										(orderGetRes.body.otherCosts).should.equal(order.otherCosts);

										// Call the assertion callback
										done();
									});
							});
					});
			});
	});

	it('NU_P_G004_E106: should not be able to get a list of Orders if not signed in', function(done) {
		// Save the Order
		order.save(function() {
			// Request Orders
			request(app).get('/api/v1/orders')
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

	it('NU_P_G004_E107: should not be able to get a single Order if not signed in', function(done) {
		// Save the Order
		order.save(function() {
			request(app).get('/api/v1/orders/' + order._id)
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

	it('NU_P_G004_E108: should not be able to delete Order instance if haven\'t admin role', function(done) {
		agent.post('/auth/signin')
			.send(credentials1)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Order
				agent.post('/api/v1/orders')
					.send(order)
					.expect(201)
					.end(function(orderSaveErr, orderSaveRes) {
						// Handle Order save error
						if (orderSaveErr) done(orderSaveErr);

						// Delete existing Order
						agent.delete('/api/v1/orders/' + orderSaveRes.body._id)
							.send(order)
							.expect(403)
							.end(function(orderDeleteErr, orderDeleteRes) {
								// Handle Order error error
								if (orderDeleteErr) done(orderDeleteErr);

								// Get an order
								agent.get(orderSaveRes.body._links.self.href)
									.expect(200)
									.end(function(orderGetErr, orderGetRes) {
										// Handle Order save error
										if (orderGetErr) done(orderGetErr);

										// Set message assertion
										orderGetRes.body.should.have.properties({
																			total: 0,
																			otherCosts: 0,
																			shippingCost: 0,
																			subtotal: 0,
																			summary: [],
																			requests: []
										});

										(orderGetRes.body._links).should.match(orderSaveRes.body._links);

										// Call the assertion callback
										done();
									});
							});
					});
			});
	});

	it('NU_P_G004_E109: should be able to delete Order instance if have admin role', function(done) {
		agent.post('/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Order
				agent.post('/api/v1/orders')
					.send(order)
					.expect(201)
					.end(function(orderSaveErr, orderSaveRes) {
						// Handle Order save error
						if (orderSaveErr) done(orderSaveErr);

						// Delete existing Order
						agent.delete('/api/v1/orders/' + orderSaveRes.body._id)
							.send(order)
							.expect(204)
							.end(function(orderDeleteErr, orderDeleteRes) {
								// Handle Order error error
								if (orderDeleteErr) done(orderDeleteErr);

								// Get a list of Orders
								agent.get('/api/v1/orders')
									.end(function(ordersGetErr, ordersGetRes) {
										// Handle Order save error
										if (ordersGetErr) done(ordersGetErr);

										// Set assertions
										(ordersGetRes.body._embedded.orders).should.be.an.Array.with.lengthOf(0);

										// Call the assertion callback
										done();
									});
							});
					});
			});
	});

	it('NU_P_G004_E110: should not be able to delete Order instance if not signed in', function(done) {
		// Set Order user
		order.user = member3;

		// Save the Order
		order.save(function() {
			// Try deleting Order
			request(app).delete('/api/v1/orders/' + order._id)
				.expect(401)
				.end(function(orderDeleteErr, orderDeleteRes) {
					// Set message assertion
					(orderDeleteRes.body.message).should.match('User is not logged in');

					// Handle Order error error
					done(orderDeleteErr);
				});

		});
	});

	it('NU_P_G004_E111: should be able to add a request to an Order instance', function(done) {
		// Save the Order
		order.save(function() {
			agent.post('/auth/signin')
				.send(credentials1)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Add a request
					agent.post('/api/v1/orders/' + order.id + '/add-request')
						.send(request1)
						.expect(200)
						.end(function(addRequestErr, addRequestRes) {
							// Handle Order save error
							if (addRequestErr) done(addRequestErr);

							var order = addRequestRes.body;

							// Set assertions
							order.should.have.properties('_id', '_links', 'requests');
							order.should.have.properties({
														total: 0,
														otherCosts: 0,
														shippingCost: 0,
														subtotal: 0,
														summary: []
							});
							(order._links.user.href).should.containEql(manager1.id);
							(order._links.groupbuy.href).should.containEql(groupbuy.id);

							(order.requests).should.be.an.Array.with.lengthOf(1);
							(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');
							(order.requests[0].user).should.containEql(manager1._id);
							(order.requests[0].items).should.be.an.Array.with.lengthOf(2);
							(order.requests[0].items[0].item).should.containEql(item1._id);
							(order.requests[0].items[0].quantity).should.match(request1.items[0].quantity);
							(order.requests[0].items[1].item).should.containEql(item2._id);
							(order.requests[0].items[1].quantity).should.match(request1.items[1].quantity);

							done();
						});
				});
		});
	});

	it('NU_P_G004_E112: should be able to add some requests to an Order instance and calculate summary and subtotal', function(done) {
		// Save the Order
		order.save(function(err) {
			agent.post('/auth/signin')
				.send(credentials1)
				.expect(200)
				.end(function(signinErr, signinRes) {
					// Handle signin error
					if (signinErr) done(signinErr);

					// Add the first request
					agent.post('/api/v1/orders/' + order.id + '/add-request')
						.send(request1)
						.expect(200)
						.end(function(addRequestErr, addRequestRes) {
							// Handle Order save error
							if (addRequestErr) done(addRequestErr);

							// Save a new Order
							agent.post('/api/v1/orders/' + order.id + '/add-request')
								.send(request2)
								.expect(200)
								.end(function(addRequestErr, addRequestRes) {
									// Handle Order save error
									if (addRequestErr) done(addRequestErr);

									var order = addRequestRes.body;

									// Set assertions
									order.should.have.properties('_id', '_links', 'requests');
									order.should.have.properties({
																total: 0,
																otherCosts: 0,
																shippingCost: 0,
																subtotal: 0,
																summary: []
									});
									(order._links.user.href).should.containEql(manager1.id);
									(order._links.groupbuy.href).should.containEql(groupbuy.id);

									(order.requests).should.be.an.Array.with.lengthOf(2);
									(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');
									(order.requests[0].user).should.containEql(manager1._id);
									(order.requests[0].items).should.be.an.Array.with.lengthOf(2);
									(order.requests[0].items[0].item).should.containEql(item1._id);
									(order.requests[0].items[0].quantity).should.match(request1.items[0].quantity);
									(order.requests[0].items[1].item).should.containEql(item2._id);
									(order.requests[0].items[1].quantity).should.match(request1.items[1].quantity);

									(order.requests[1]).should.have.properties('_id', 'user', 'requestDate', 'items');
									(order.requests[1].user).should.containEql(manager1._id);
									(order.requests[1].items).should.be.an.Array.with.lengthOf(3);
									(order.requests[1].items[0].item).should.containEql(item1._id);
									(order.requests[1].items[0].quantity).should.match(request2.items[0].quantity);
									(order.requests[1].items[1].item).should.containEql(item2._id);
									(order.requests[1].items[1].quantity).should.match(request2.items[1].quantity);
									(order.requests[1].items[2].item).should.containEql(item3._id);
									(order.requests[1].items[2].quantity).should.match(request2.items[2].quantity);

									agent.post('/api/v1/orders/' + order.id + '/calculate')
										.send(request2)
										.expect(200)
										.end(function(calculateSummaryErr, calculateSummaryRes) {
											// Handle Order save error
											if (calculateSummaryErr) done(calculateSummaryErr);

											var order = calculateSummaryRes.body;

											// Set assertions
											order.should.have.properties('_id', '_links', 'requests', 'subtotal', 'summary', 'total');
											order.should.have.properties({
																		otherCosts: 0,
																		shippingCost: 0
											});
											(order._links.user.href).should.containEql(manager1.id);
											(order._links.groupbuy.href).should.containEql(groupbuy.id);

											// Check requests again
											(order.requests).should.be.an.Array.with.lengthOf(2);
											(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');
											(order.requests[0].user).should.containEql(manager1._id);
											(order.requests[0].items).should.be.an.Array.with.lengthOf(2);
											(order.requests[0].items[0].item).should.containEql(item1._id);
											(order.requests[0].items[0].quantity).should.match(request1.items[0].quantity);
											(order.requests[0].items[1].item).should.containEql(item2._id);
											(order.requests[0].items[1].quantity).should.match(request1.items[1].quantity);
											(order.requests[1]).should.have.properties('_id', 'user', 'requestDate', 'items');
											(order.requests[1].user).should.containEql(manager1._id);
											(order.requests[1].items).should.be.an.Array.with.lengthOf(3);
											(order.requests[1].items[0].item).should.containEql(item1._id);
											(order.requests[1].items[0].quantity).should.match(request2.items[0].quantity);
											(order.requests[1].items[1].item).should.containEql(item2._id);
											(order.requests[1].items[1].quantity).should.match(request2.items[1].quantity);
											(order.requests[1].items[2].item).should.containEql(item3._id);
											(order.requests[1].items[2].quantity).should.match(request2.items[2].quantity);

											// Check summary
											(order.summary).should.be.an.Array.with.lengthOf(3);
											(order.summary[0].item).should.containEql(item1._id);
											(order.summary[0].quantity).should.match(request1.items[0].quantity + request2.items[0].quantity);
											(order.summary[1].item).should.containEql(item2._id);
											(order.summary[1].quantity).should.match(request1.items[1].quantity + request2.items[1].quantity);
											(order.summary[2].item).should.containEql(item3._id);
											(order.summary[2].quantity).should.match(request2.items[2].quantity);

											done();
										});
								});
						});
				});
		});
	});

	it('NU_P_G004_E113: should be able to list orders filtering by myself', function(done) {
		var groupbuy2 = new Groupbuy({
			title: 'Groupbuy #2',
			description: '...',
			user: manager2
		});

		var item4 = new Item({
			title: 'Item 4',
			description: 'Description 4',
			price: 3.88,
			user: manager2,
			groupbuy: groupbuy2
		});

		var order2 = new Order({
			groupbuy: groupbuy,
			user: manager2.id
		});

		var order3 = new Order({
			groupbuy: groupbuy2,
			user: manager1.id
		});

		var order4 = new Order({
			groupbuy: groupbuy,
			user: member3.id
		});

		var request4 = {
			items: [
				{item: item2.id, quantity: 1}
			]
		};

		var request5 = {
			items: [
				{item: item4.id, quantity: 1}
			]
		};

		// Groupbuy1 have Items: 1, 2 & 3
		// Order (1) is made by manager1 to groupbuy (1)

		groupbuy2.save(function(err) {
			if (err) console.error(err);

			item4.save(function(err) {
				if (err) console.error(err);

				order.save(function(err) {
					if (err) console.error(err);

					order2.save(function(err) {
						if (err) console.error(err);

						order3.save(function(err) {
							if (err) console.error(err);

							order4.save(function(err) {
								if (err) console.error(err);

								order.addRequest (request1, null, function(err) {
									if (err) console.error(err);

									order2.addRequest (request2, null, function(err) {
										if (err) console.error(err);

										order3.addRequest (request5, null, function(err) {
											if (err) console.error(err);

											order4.addRequest (request4, null, function(err) {
												if (err) console.error(err);

												agent.post('/auth/signin')
													.send(credentials1)
													.expect(200)
													.end(function(signinErr, signinRes) {
														// Handle signin error
														if (signinErr) done(signinErr);

														agent.get('/api/v1/users/' + manager1.id + '/orders')
															.expect(200)
															.end(function(ordersGetErr, ordersGetRes) {
																// Handle Order save error
																if (ordersGetErr) done(ordersGetErr);

																// Get Orders list
																var orders = ordersGetRes.body._embedded.orders;

																// Set assertions
																orders.should.be.an.Array.with.lengthOf(2);

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
				});
			});
		});
	});

	it('NU_P_G004_E114: should be able to list orders filtering by groupbuy that user is manager', function(done) {
		var order2 = new Order({
			groupbuy: groupbuy,
			user: manager2.id
		});

		var order4 = new Order({
			groupbuy: groupbuy,
			user: member3.id
		});

		var request4 = {
			items: [
				{item: item2.id, quantity: 1}
			]
		};

		// Groupbuy1 have Items: 1, 2 & 3
		// Order (1) is made by manager1 to groupbuy (1)

		order.save(function(err) {
			if (err) console.error(err);

			order2.save(function(err) {
				if (err) console.error(err);

				order4.save(function(err) {
					if (err) console.error(err);

					order.addRequest (request1, null, function(err) {
						if (err) console.error(err);

						order2.addRequest (request2, null, function(err) {
							if (err) console.error(err);

							order4.addRequest (request4, null, function(err) {
								if (err) console.error(err);

								agent.post('/auth/signin')
									.send(credentials1)
									.expect(200)
									.end(function(signinErr, signinRes) {
										// Handle signin error
										if (signinErr) done(signinErr);

										agent.get('/api/v1/groupbuys/' + groupbuy.id + '/orders')
											.expect(200)
											.end(function(ordersGetErr, ordersGetRes) {
												// Handle Order save error
												if (ordersGetErr) done(ordersGetErr);

												// Get Orders list
												var orders = ordersGetRes.body._embedded.orders;

												// Set assertions
												orders.should.be.an.Array.with.lengthOf(3);

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

	it('NU_P_G004_E115: should not be able to list orders filtering by groupbuy that user is not member', function(done) {
		var groupbuy2 = new Groupbuy({
			title: 'Groupbuy #2',
			description: '...',
			user: manager2
		});

		var item4 = new Item({
			title: 'Item 4',
			description: 'Description 4',
			price: 3.88,
			user: manager2,
			groupbuy: groupbuy2
		});

		var order2 = new Order({
			groupbuy: groupbuy,
			user: manager2.id
		});

		var order3 = new Order({
			groupbuy: groupbuy2,
			user: manager1.id
		});

		var order4 = new Order({
			groupbuy: groupbuy,
			user: member3.id
		});

		var request4 = {
			items: [
				{item: item2.id, quantity: 1}
			]
		};

		var request5 = {
			items: [
				{item: item4.id, quantity: 1}
			]
		};

		// Groupbuy1 have Items: 1, 2 & 3
		// Order (1) is made by manager1 to groupbuy (1)

		groupbuy2.save(function(err) {
			if (err) console.error(err);

			item4.save(function(err) {
				if (err) console.error(err);

				order.save(function(err) {
					if (err) console.error(err);

					order2.save(function(err) {
						if (err) console.error(err);

						order3.save(function(err) {
							if (err) console.error(err);

							order4.save(function(err) {
								if (err) console.error(err);

								order.addRequest (request1, null, function(err) {
									if (err) console.error(err);

									order2.addRequest (request2, null, function(err) {
										if (err) console.error(err);

										order3.addRequest (request5, null, function(err) {
											if (err) console.error(err);

											order4.addRequest (request4, null, function(err) {
												if (err) console.error(err);

												agent.post('/auth/signin')
													.send(credentials1)
													.expect(200)
													.end(function(signinErr, signinRes) {
														// Handle signin error
														if (signinErr) done(signinErr);

														agent.get('/api/v1/groupbuys/' + groupbuy.id + '/orders')
															.expect(200)
															.end(function(ordersGetErr, ordersGetRes) {
																// Handle Order save error
																if (ordersGetErr) done(ordersGetErr);

																// Get Orders list
																var orders = ordersGetRes.body._embedded.orders;

																// Set assertions
																orders.should.be.an.Array.with.lengthOf(3);

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
				});
			});
		});
	});

	it('NU_P_G004_E116: should not be able to list orders made by another user', function(done) {
		// Groupbuy1 have Items: 1, 2 & 3
		// Order (1) is made by manager1 to groupbuy (1)
		order.save(function(err) {
			if (err) console.error(err);

			order.addRequest (request1, null, function(err) {
				if (err) console.error(err);

				agent.post('/auth/signin')
					.send(credentials3)
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						agent.get('/api/v1/users/' + manager1.id + '/orders')
							.expect(403)
							.end(function(ordersGetErr, ordersGetRes) {
								(ordersGetRes.body.name).should.match('NotAuthorized');

								done(ordersGetErr);
							});
					});
			});
		});
	});

	it('NU_P_G004_E117: should be able to list orders made by another user if I am an admin', function(done) {
		// Groupbuy1 have Items: 1, 2 & 3
		// Order (1) is made by manager1 to groupbuy (1)
		order.save(function(err) {
			if (err) console.error(err);

			order.addRequest (request1, null, function(err) {
				if (err) console.error(err);

				agent.post('/auth/signin')
					.send(credentialsA)
					.expect(200)
					.end(function(signinErr, signinRes) {
						// Handle signin error
						if (signinErr) done(signinErr);

						agent.get('/api/v1/users/' + manager1.id + '/orders')
							.expect(200)
							.end(function(ordersGetErr, ordersGetRes) {
								// Handle Order save error
								if (ordersGetErr) done(ordersGetErr);

								// Get Orders list
								var orders = ordersGetRes.body._embedded.orders;

								// Set assertions
								orders.should.be.an.Array.with.lengthOf(1);

								done();
							});
					});
			});
		});
	});

});