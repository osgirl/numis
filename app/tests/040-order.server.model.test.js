'use strict';

/**
 * Module dependencies.
 */
var should   = require('should'),
	mongoose = require('mongoose'),
	User     = mongoose.model('User'),
	Currency = mongoose.model('Currency'),
	Groupbuy = mongoose.model('Groupbuy'),
	Item     = mongoose.model('Item'),
	Order    = mongoose.model('Order');

/**
 * Globals
 */
var user, currency, currency2, groupbuy, order, item1, item2, item3;

/**
 * Unit tests
 */
describe('Order Model Unit Tests:', function() {
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
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password',
			provider: 'local'
		});

		groupbuy = new Groupbuy({
			title: 'Groupbuy #1',
			description: 'Lorem ipsum dolor sit amet...',
			user: user
		});

		item1 = new Item({
			title: 'Item 1',
			description: 'Description 1',
			price: 22.34,
			maxQuantity: 10,
			currency: currency.id,
			user: user,
			groupbuy: groupbuy
		});

		item2 = new Item({
			title: 'Item 2',
			description: 'Description 2',
			price: 12.34,
			maxQuantity: 9,
			user: user,
			groupbuy: groupbuy
		});

		// Create one Item to Groupbuy 2
		item3 = new Item({
			title: 'Item 3',
			description: 'Description 3',
			price: 650,
			user: user,
			groupbuy: groupbuy
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
						user.save(function(err) {
							if (err) console.error(err);

							groupbuy.save(function(err) {
								if (err) console.error(err);

								item1.save(function(err) {
									if (err) console.error(err);

									item2.save(function(err) {
										if (err) console.error(err);

										item3.save(function(err) {
											if (err) console.error(err);

											order = new Order({
												groupbuy: groupbuy,
												user: user
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


	describe('Method Save', function() {
		it('NU_P_G004_E001: should be able to save without problems', function(done) {
			return order.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('NU_P_G004_E002: should be able to show an error when try to save without user', function(done) {
			order.user = '';

			return order.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_P_G004_E003: should be able to show an error when try to save without groupbuy', function(done) {
			order.groupbuy = '';

			return order.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_P_G004_E004: should be able to save order with one request with one item without problems', function(done) {
			var request = {
				user: user,
				items: [ {item: item1, quantity: 1} ]
			};

			order.addRequest (request, null, function(err) {
				should.not.exist(err);

				(order.requests).should.be.an.Array.with.lengthOf(1);
				(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');
				(order.requests[0].user).should.match(user._id);

				(order.requests[0].items).should.be.an.Array.with.lengthOf(1);
				(order.requests[0].items[0].item).should.match(item1._id);
				(order.requests[0].items[0].quantity).should.match(request.items[0].quantity);

				done();
			});
		});

		it('NU_P_G004_E005: should be able to save order with one request with nevative quantity without problems', function(done) {
			var request = {
				user: user,
				items: [ {item: item1, quantity: -1} ]
			};

			order.addRequest (request, null, function(err) {
				should.not.exist(err);

				(order.requests).should.be.an.Array.with.lengthOf(1);
				(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');

				(order.requests[0].items).should.be.an.Array.with.lengthOf(1);
				(order.requests[0].items[0].quantity).should.match(request.items[0].quantity);

				done();
			});
		});

		it('NU_P_G004_E006: should be able to save order with one requests with many items without problems', function(done) {
			var request = {
				user: user,
				items: [
						{item: item1, quantity: 1},
						{item: item2, quantity: 3}
				]
			};

			order.addRequest (request, null, function(err) {
				should.not.exist(err);

				(order.requests).should.be.an.Array.with.lengthOf(1);
				(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');
				(order.requests[0].user).should.match(user._id);

				(order.requests[0].items).should.be.an.Array.with.lengthOf(2);
				(order.requests[0].items[0].item).should.match(item1._id);
				(order.requests[0].items[0].quantity).should.match(request.items[0].quantity);
				(order.requests[0].items[1].item).should.match(item2._id);
				(order.requests[0].items[1].quantity).should.match(request.items[1].quantity);

				done();
			});
		});

		it('NU_P_G004_E007: should be able to save order with many requests without problems', function(done) {
			var request1, request2, request3;

			request1 = {
				user: user,
				items: [
						{item: item1, quantity: 1},
						{item: item2, quantity: 1}
				]
			};

			request2 = {
				items: [
					{item: item1, quantity: 4},
					{item: item2, quantity: 4},
					{item: item3, quantity: 5}
				]
			};

			request3 = {
				items: [
						{item: item1, quantity: -3},
						{item: item2, quantity: -3},
						{item: item3, quantity: -3}
				]
			};

			// Add request 1 and 2 to the order before save it.
			order.addRequest (request1, null, function(err) {
				should.not.exist(err);

				(order.requests).should.be.an.Array.with.lengthOf(1);

				// Request 1
				(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');
				(order.requests[0].user).should.match(user._id);
				(order.requests[0].items).should.be.an.Array.with.lengthOf(2);
				(order.requests[0].items[0].item).should.match(item1._id);
				(order.requests[0].items[0].quantity).should.match(request1.items[0].quantity);
				(order.requests[0].items[1].item).should.match(item2._id);
				(order.requests[0].items[1].quantity).should.match(request1.items[1].quantity);

				order.addRequest (request2, null, function(err) {
					should.not.exist(err);

					(order.requests).should.be.an.Array.with.lengthOf(2);

					// Request 2
					(order.requests[1]).should.have.properties('_id', 'user', 'requestDate', 'items');
					(order.requests[1].user).should.match(user._id);
					(order.requests[1].items).should.be.an.Array.with.lengthOf(3);
					(order.requests[1].items[0].item).should.match(item1._id);
					(order.requests[1].items[0].quantity).should.match(request2.items[0].quantity);
					(order.requests[1].items[1].item).should.match(item2._id);
					(order.requests[1].items[1].quantity).should.match(request2.items[1].quantity);
					(order.requests[1].items[2].item).should.match(item3._id);
					(order.requests[1].items[2].quantity).should.match(request2.items[2].quantity);

					// Add request 3 after save the order
					order.addRequest (request3, null, function(err) {
						should.not.exist(err);

						(order.requests).should.be.an.Array.with.lengthOf(3);

						// Request 1
						(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');
						(order.requests[0].user).should.match(user._id);
						(order.requests[0].items).should.be.an.Array.with.lengthOf(2);
						(order.requests[0].items[0].item).should.match(item1._id);
						(order.requests[0].items[0].quantity).should.match(request1.items[0].quantity);
						(order.requests[0].items[1].item).should.match(item2._id);
						(order.requests[0].items[1].quantity).should.match(request1.items[1].quantity);

						// Request 2
						(order.requests[1]).should.have.properties('_id', 'user', 'requestDate', 'items');
						(order.requests[1].user).should.match(user._id);
						(order.requests[1].items).should.be.an.Array.with.lengthOf(3);
						(order.requests[1].items[0].item).should.match(item1._id);
						(order.requests[1].items[0].quantity).should.match(request2.items[0].quantity);
						(order.requests[1].items[1].item).should.match(item2._id);
						(order.requests[1].items[1].quantity).should.match(request2.items[1].quantity);
						(order.requests[1].items[2].item).should.match(item3._id);
						(order.requests[1].items[2].quantity).should.match(request2.items[2].quantity);

						// Request 3
						(order.requests[2]).should.have.properties('_id', 'user', 'requestDate', 'items');
						(order.requests[2].user).should.match(user._id);
						(order.requests[2].items).should.be.an.Array.with.lengthOf(3);
						(order.requests[2].items[0].item).should.match(item1._id);
						(order.requests[2].items[0].quantity).should.match(request3.items[0].quantity);
						(order.requests[2].items[1].item).should.match(item2._id);
						(order.requests[2].items[1].quantity).should.match(request3.items[1].quantity);
						(order.requests[2].items[2].item).should.match(item3._id);
						(order.requests[2].items[2].quantity).should.match(request3.items[2].quantity);

						done();
					});
				});
			});
		});

		it('NU_P_G004_E008: should be able to calculate summary with 0 requests without problems', function(done) {
			order.calculateSummary(function(err) {
				should.not.exist(err);

				(order).should.have.properties('_id', 'user', 'requests', 'summary');
				(order.requests).should.be.an.Array.with.lengthOf(0);
				(order.summary).should.be.an.Array.with.lengthOf(0);

				done();
			});
		});

		it('NU_P_G004_E009: should be able to calculate summary with 1 request without problems', function(done) {
			var request = {
				items: [
						{item: item1, quantity: 1},
						{item: item2, quantity: 5}
				]
			};

			// Add request to the order and calculate summary.
			order.addRequest (request, null, function(err) {
				should.not.exist(err);

				order.calculateSummary(function(err) {
					should.not.exist(err);

					(order).should.have.properties('_id', 'user', 'requests', 'summary');
					(order.requests).should.be.an.Array.with.lengthOf(1);
					(order.summary).should.be.an.Array.with.lengthOf(2);

					done();
				});
			});
		});

		it('NU_P_G004_E010: should be able to calculate summary with many request without problems', function(done) {
			var request1, request2, request3;

			request1 = {
				user: user,
				items: [
						{item: item1, quantity: 1},
						{item: item2, quantity: 1}
				]
			};

			request2 = {
				items: [
					{item: item1, quantity: 4},
					{item: item2, quantity: 4},
					{item: item3, quantity: 5}
				]
			};

			request3 = {
				items: [
						{item: item1, quantity: -3},
						{item: item2, quantity: -3},
						{item: item3, quantity: -3}
				]
			};

			// Add requests 1 and 2 and calculate summary
			order.addRequest (request1, null, function(err) {
				should.not.exist(err);

				order.addRequest (request2, null, function(err) {
					should.not.exist(err);

					order.calculateSummary(function(err) {
						should.not.exist(err);

						// Add request 3. The summary should be update automatically.
						order.addRequest (request3, null, function(err) {
							should.not.exist(err);

							(order).should.have.properties('_id', 'user', 'requests', 'summary');
							(order.requests).should.be.an.Array.with.lengthOf(3);
							(order.summary).should.be.an.Array.with.lengthOf(3);

							(order.summary[0].quantity).should.match(2);
							(order.summary[1].quantity).should.match(2);
							(order.summary[2].quantity).should.match(2);

							done();
						});
					});
				});
			});
		});

		it('NU_P_G004_E011: should be able to remove previous request without problems', function(done) {
			var request1, request2, request3;

			request1 = {
				user: user,
				items: [
						{item: item1, quantity: 1},
						{item: item2, quantity: 1}
				]
			};

			request2 = {
				items: [
					{item: item1, quantity: 4},
					{item: item2, quantity: 4},
					{item: item3, quantity: 5}
				]
			};

			request3 = {
				items: [
						{item: item1, quantity: -3},
						{item: item2, quantity: -3},
						{item: item3, quantity: -3}
				]
			};

			// Add requests and calculate summary
			order.addRequest (request1, null, function(err) {
				should.not.exist(err);

				order.addRequest (request2, null, function(err) {
					should.not.exist(err);

					order.addRequest (request3, null, function(err) {
						should.not.exist(err);

						// Calculate summary
						order.calculateSummary(function(err, order) {
							should.not.exist(err);

							(order).should.have.properties('_id', 'user', 'requests', 'summary');
							(order.requests).should.be.an.Array.with.lengthOf(3);
							(order.summary).should.be.an.Array.with.lengthOf(3);

							(order.summary[0].quantity).should.match(2);
							(order.summary[1].quantity).should.match(2);
							(order.summary[2].quantity).should.match(2);
							//(order.subtotal).should.match( 2 * (item1.price + item2.price + item3.price) );
							(order.total).should.match(order.subtotal);

							// Remove request 2
							order.removeRequest (order.requests[1]._id, function(err) {
								should.not.exist(err);

								// Summary doesn't allow negative quantities.
								(order.summary[0].quantity).should.match(0);
								(order.summary[1].quantity).should.match(0);
								(order.summary[2].quantity).should.match(0);
								(order.subtotal).should.match(0);
								(order.total).should.match(0);

								// Remove request 3
								order.removeRequest (order.requests[1]._id, function(err) {
									should.not.exist(err);

									(order.requests).should.be.an.Array.with.lengthOf(1);
									(order.summary).should.be.an.Array.with.lengthOf(2);

									(order.summary[0].quantity).should.match(1);
									(order.summary[1].quantity).should.match(1);
									(order.subtotal).should.match( item1.price + item2.price );
									(order.total).should.match(order.subtotal);

									done();
								});
							});
						});
					});
				});
			});
		});

		it('NU_P_G004_E012: should be able to manage multiple orders by many members', function(done) {
			var order1, order2, order3;
			var manager, member1, member2;
			var request1, request2, request3;

			manager = user;

			member1 = new User({
				firstName: 'John',
				lastName: 'Doe',
				email: 'jdoe@test.com',
				username: 'jdoe',
				password: 'password',
				provider: 'local'
			});

			member2 = new User({
				firstName: 'Juan',
				lastName: 'Sánchez',
				email: 'jsanchez@test.com',
				username: 'jsanchez',
				password: 'password',
				provider: 'local'
			});

			member1.save(function(err) {
				if (err) console.error(err);

				member2.save(function(err) {
					if (err) console.error(err);

					order1 = new Order({
						groupbuy: groupbuy.id,
						user: manager.id
					});
					order2 = new Order({
						groupbuy: groupbuy.id,
						user: member1.id
					});
					order3 = new Order({
						groupbuy: groupbuy.id,
						user: member2.id
					});

					// manager
					request1 = {
						items: [
							{item: item1.id, quantity: 1},
							{item: item2.id, quantity: 1}
						]
					};

					// member1
					request2 = {
						items: [
							{item: item1.id, quantity: 4},
							{item: item2.id, quantity: 4},
							{item: item3.id, quantity: 4}
						]
					};

					// member2
					request3 = {
						items: [
							{item: item1.id, quantity: 4},
							{item: item2.id, quantity: 4},
							{item: item3.id, quantity: 4}
						]
					};

					// Save the Order 1
					order1.addRequest (request1, user, function(err) {
						should.not.exist(err);

						// Save the Order 2
						order2.addRequest (request2, member1, function(err) {
							should.not.exist(err);

							// Save the Order 3
							order3.addRequest (request3, member2, function(err) {
								should.not.exist(err);

								// Check groupbuy orders
								Order.count({groupbuy: groupbuy.id}, function(err, count) {
									should.not.exist(err);

									count.should.match(3);

									Order.count({user: member1.id}, function(err, count) {
										should.not.exist(err);

										count.should.match(1);

										done();
									});
								});
							});
						});
					});


				});
			});
		});

		it('NU_P_G004_E013: should not be able to do multiple orders by one members', function(done) {
			var order1, order2, order3;
			var manager, member1;
			var request1, request2, request3;

			manager = user;

			member1 = new User({
				firstName: 'John',
				lastName: 'Doe',
				email: 'jdoe@test.com',
				username: 'jdoe',
				password: 'password',
				provider: 'local'
			});

			member1.save(function(err) {
				if (err) console.error(err);

				order1 = new Order({
					groupbuy: groupbuy.id,
					user: manager.id
				});
				order2 = new Order({
					groupbuy: groupbuy.id,
					user: member1.id
				});
				order3 = new Order({
					groupbuy: groupbuy.id,
					user: member1.id
				});

				// manager
				request1 = {
					items: [
						{item: item1.id, quantity: 1},
						{item: item2.id, quantity: 1}
					]
				};

				// member1
				request2 = {
					items: [
						{item: item1.id, quantity: 4},
						{item: item2.id, quantity: 4},
						{item: item3.id, quantity: 4}
					]
				};

				// member2
				request3 = {
					items: [
						{item: item1.id, quantity: 1},
						{item: item2.id, quantity: 1},
						{item: item3.id, quantity: 1}
					]
				};

				// Save the Order 1
				order1.addRequest (request1, user, function(err) {
					should.not.exist(err);

					// Save the Order 2
					order2.addRequest (request2, member1, function(err) {
						should.not.exist(err);

						// Save the Order 3
						order3.addRequest (request3, member1, function(err) {
							should.exist(err);

							// Check groupbuy orders
							Order.count({groupbuy: groupbuy.id}, function(err, count) {
								should.not.exist(err);

								count.should.match(2);

								Order.count({user: member1.id}, function(err, count) {
									should.not.exist(err);

									count.should.match(1);

									done();
								});
							});
						});
					});
				});
			});
		});

		it('NU_P_G004_E014: should be able to do multiple orders, one per groupbuy', function(done) {
			var groupbuy2, item4, order1, order2, request1, request2;

			groupbuy2 = new Groupbuy({
				title: 'Groupbuy #2',
				description: 'Lorem ipsum dolor sit amet...',
				user: user
			});

			item4 = new Item({
				title: 'Item 4',
				description: 'Description 4',
				price: 12.34,
				user: user,
				groupbuy: groupbuy2
			});

			groupbuy2.save(function(err) {
				should.not.exist(err);

				item4.save(function(err) {
					should.not.exist(err);

					// order 1
					order1 = new Order({
						groupbuy: groupbuy.id,
						user: user.id
					});
					request1 = {
						items: [
							{item: item1.id, quantity: 1},
							{item: item2.id, quantity: 1}
						]
					};

					// order 2
					order2 = new Order({
						groupbuy: groupbuy2.id,
						user: user.id
					});
					request2 = {
						items: [
							{item: item4.id, quantity: 4}
						]
					};

					// Save the Order 1
					order1.addRequest (request1, user, function(err) {
						should.not.exist(err);

						// Save the Order 2
						order2.addRequest (request2, user, function(err) {
							should.not.exist(err);

							// Check groupbuy1 orders
							Order.count({groupbuy: groupbuy.id}, function(err, count) {
								should.not.exist(err);

								count.should.match(1);

								// Check groupbuy2 orders
								Order.count({groupbuy: groupbuy2.id}, function(err, count) {
									should.not.exist(err);

									count.should.match(1);

									Order.count({user: user.id}, function(err, count) {
										should.not.exist(err);

										count.should.match(2);

										done();
									});
								});
							});
						});
					});
				});
			});
		});

		it('NU_P_G004_E015: should be able to get available quantity of items in a groupbuy', function(done) {
			var member1, member2, item4;
			var order1, order2, order3;
			var request1, request2, request3;

			member1 = new User({
				firstName: 'John',
				lastName: 'Doe',
				email: 'jdoe@test.com',
				username: 'jdoe',
				password: 'password',
				provider: 'local'
			});

			member2 = new User({
				firstName: 'Juan',
				lastName: 'Sánchez',
				email: 'jsanchez@test.com',
				username: 'jsanchez',
				password: 'password',
				provider: 'local'
			});

			member1.save(function(err) {
				if (err) console.error(err);

				member2.save(function(err) {
					if (err) console.error(err);

					// Order 1 (manager)
					order1 = new Order({
						groupbuy: groupbuy.id,
						user: user.id
					});
					request1 = {
						items: [
							{item: item2.id, quantity: 1}
						]
					};

					// Order 2
					order2 = new Order({
						groupbuy: groupbuy.id,
						user: member1.id
					});
					request2 = {
						items: [
							{item: item1.id, quantity: 4},
							{item: item2.id, quantity: 4},
							{item: item3.id, quantity: 4}
						]
					};

					// Order 3
					order3 = new Order({
						groupbuy: groupbuy.id,
						user: member2.id
					});
					request3 = {
						items: [
							{item: item1.id, quantity: 2},
							{item: item2.id, quantity: 2},
							{item: item3.id, quantity: 2}
						]
					};

					// Save the Order 1
					order1.addRequest (request1, user, function(err) {
						should.not.exist(err);

						// Save the Order 2
						order2.addRequest (request2, member1, function(err) {
							should.not.exist(err);

							// Save the Order 3
							order3.addRequest (request3, member2, function(err) {
								should.not.exist(err);

								item1.getAvailability(function(err, num) {
									num.should.match(4);
								});
								item2.getAvailability(function(err, num) {
									num.should.match(2);
								});
								item3.getAvailability(function(err, num) {
									num.should.match('');
								});

								done();
							});
						});
					});
				});
			});
		});

		it('NU_P_G004_E016: should not be able to make a request if there is no availabitiy of an item', function(done) {
			var member1, member2, item4;
			var order1, order2, order3;
			var request1, request2, request3;

			member1 = new User({
				firstName: 'John',
				lastName: 'Doe',
				email: 'jdoe@test.com',
				username: 'jdoe',
				password: 'password',
				provider: 'local'
			});

			member2 = new User({
				firstName: 'Juan',
				lastName: 'Sánchez',
				email: 'jsanchez@test.com',
				username: 'jsanchez',
				password: 'password',
				provider: 'local'
			});

			member1.save(function(err) {
				if (err) console.error(err);

				member2.save(function(err) {
					if (err) console.error(err);

					// Order 1 (manager)
					order1 = new Order({
						groupbuy: groupbuy.id,
						user: user.id
					});
					request1 = {
						items: [
							{item: item2.id, quantity: 1}
						]
					};

					// Order 2
					order2 = new Order({
						groupbuy: groupbuy.id,
						user: member1.id
					});
					request2 = {
						items: [
							{item: item1.id, quantity: 4},
							{item: item2.id, quantity: 4},
							{item: item3.id, quantity: 4}
						]
					};

					// Order 3
					order3 = new Order({
						groupbuy: groupbuy.id,
						user: member2.id
					});
					request3 = {
						items: [
							{item: item1.id, quantity: 5},
							{item: item2.id, quantity: 5},
							{item: item3.id, quantity: 5}
						]
					};

					// Save the Order 1
					order1.addRequest (request1, user, function(err) {
						should.not.exist(err);

						// Save the Order 2
						order2.addRequest (request2, member1, function(err) {
							should.not.exist(err);

							// Save the Order 3
							order3.addRequest (request3, member2, function(err) {
								should.exist(err);

								item1.getAvailability(function(err, num) {
									num.should.match(6);
								});
								item2.getAvailability(function(err, num) {
									num.should.match(4);
								});
								item3.getAvailability(function(err, num) {
									num.should.match('');
								});

								done();
							});
						});
					});
				});
			});
		});

		it('NU_P_G004_E017: should be able to use diferent currencies for local and provider', function(done) {
			var yGroupbuy, yItem1, yItem2, yItem3, yItem4, yItem5, yItem6;
			var member1, member2;
			var order1, order2;
			var request1, request2;

			yGroupbuy = new Groupbuy({
				title: '500 yenes - Serie Prefecturas',
				description: 'Compra de la serie monedas de 500 yen sobre las 47 prefecturas de Japón',
				currencies: {
					local: currency.id,
					provider: currency2.id,
					exchangeRate: 130.12,
					multiplier: 1.05
				},
				user: user
			});

			member1 = new User({
				firstName: 'John',
				lastName: 'Doe',
				email: 'jdoe@test.com',
				username: 'jdoe',
				password: 'password',
				provider: 'local'
			});

			member2 = new User({
				firstName: 'Juan',
				lastName: 'Sánchez',
				email: 'jsanchez@test.com',
				username: 'jsanchez',
				password: 'password',
				provider: 'local'
			});

			member1.save(function(err) {
				if (err) console.error(err);

				member2.save(function(err) {
					if (err) console.error(err);

					yGroupbuy.save(function(err) {
						if (err) console.error(err);

						yItem1 = new Item({
							title: '35 Mie',
							description: 'Moneda bimetálica de 500 yenes, 2014.',
							price: 680,
							currency: currency2.id,
							maxQuantity: 30,
							user: user,
							groupbuy: yGroupbuy.id
						});

						yItem2 = new Item({
							title: '34 - Yamagata',
							description: 'Moneda bimetálica de 500 yenes, 2014.',
							price: 700,
							currency: currency2.id,
							maxQuantity: 30,
							user: user,
							groupbuy: yGroupbuy.id
						});

						yItem3 = new Item({
							title: '33 - Ehime',
							description: 'Moneda bimetálica de 500 yenes, 2014.',
							price: 650,
							currency: currency2.id,
							maxQuantity: 30,
							user: user,
							groupbuy: yGroupbuy.id
						});

						yItem4 = new Item({
							title: '32 - Kagoshima',
							description: 'Moneda bimetálica de 500 yenes, 2013.',
							price: 700,
							currency: currency2.id,
							maxQuantity: 30,
							user: user,
							groupbuy: yGroupbuy.id
						});

						yItem5 = new Item({
							title: '31 - Yamanashi',
							description: 'Moneda bimetálica de 500 yenes, 2013.',
							price: 650,
							currency: currency2.id,
							maxQuantity: 30,
							user: user,
							groupbuy: yGroupbuy.id
						});

						yItem6 = new Item({
							title: '30 - Shizuoka',
							description: 'Moneda bimetálica de 500 yenes, 2013.',
							price: 650,
							currency: currency2.id,
							maxQuantity: 22,
							user: user,
							groupbuy: yGroupbuy.id
						});

						yItem1.save(function(err) {
							if (err) console.error(err);

							yItem2.save(function(err) {
								if (err) console.error(err);

								yItem3.save(function(err) {
									if (err) console.error(err);

									yItem4.save(function(err) {
										if (err) console.error(err);

										yItem5.save(function(err) {
											if (err) console.error(err);

											yItem6.save(function(err) {
												if (err) console.error(err);

												order1 = new Order({
													groupbuy: yGroupbuy.id,
													user: member1.id
												});
												request1 = {
													items: [
														{item: yItem1.id, quantity: 1},
														{item: yItem2.id, quantity: 1},
														{item: yItem3.id, quantity: 1}
													]
												};

												// Order 2
												order2 = new Order({
													groupbuy: yGroupbuy.id,
													user: member2.id
												});
												request2 = {
													items: [
														{item: yItem1.id, quantity: 1},
														{item: yItem2.id, quantity: 1},
														{item: yItem3.id, quantity: 1},
														{item: yItem4.id, quantity: 1},
														{item: yItem5.id, quantity: 1},
														{item: yItem6.id, quantity: 1}
													]
												};

												// Save the Order 1
												order1.addRequest (request1, member1, function(err) {
													should.not.exist(err);

													// Save the Order 2
													order2.addRequest (request2, member2, function(err) {
														should.not.exist(err);

														yItem1.getAvailability(function(err, num) {
															num.should.match(28);
														});
														yItem4.getAvailability(function(err, num) {
															num.should.match(29);
														});
														yItem6.getAvailability(function(err, num) {
															num.should.match(21);
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

});