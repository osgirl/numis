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
var user, manager, currency, groupbuy, order, item1, item2, item3;

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
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password',
			provider: 'local'
		});

		manager = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'jdoe@test.com',
			username: 'jdoe',
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
			currency: currency.id,
			user: user,
			groupbuy: groupbuy
		});

		item2 = new Item({
			title: 'Item 2',
			description: 'Description 2',
			price: 12.34,
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
						order.calculateSummary(function(err) {
							should.not.exist(err);

							(order).should.have.properties('_id', 'user', 'requests', 'summary');
							(order.requests).should.be.an.Array.with.lengthOf(3);
							(order.summary).should.be.an.Array.with.lengthOf(3);

							(order.summary[0].quantity).should.match(2);
							(order.summary[1].quantity).should.match(2);
							(order.summary[2].quantity).should.match(2);
							(order.subtotal).should.match( 2 * (item1.price + item2.price + item3.price) );
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
	});

});