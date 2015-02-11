'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy'),
	Item = mongoose.model('Item'),
	Order = mongoose.model('Order');

/**
 * Globals
 */
var user, manager, groupbuy, order, item1, item2, item3;

/**
 * Unit tests
 */
describe('Order Model Unit Tests:', function() {
	beforeEach(function(done) {
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password'
		});

		manager = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'jdoe@test.com',
			username: 'jdoe',
			password: 'password'
		});

		groupbuy = new Groupbuy({
			title: 'Groupbuy #1',
			description: 'Lorem ipsum dolor sit amet...',
			user: user
		});

		item1 = new Item({
			title: 'Item 1',
			price: 22.34,
			currency: {
				code: 'EUR',
				symbol: '€'
			},
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
			price: 650,
			user: user,
			groupbuy: groupbuy
		});

		user.save(function() {
			groupbuy.save(function() {
				item1.save(function() {
					item2.save(function() {
						item3.save(function() {
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

	describe('Method Save', function() {
		it('1 - should be able to save without problems', function(done) {
			return order.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('2 - should be able to show an error when try to save without user', function(done) {
			order.user = '';

			return order.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('3 - should be able to show an error when try to save without groupbuy', function(done) {
			order.groupbuy = '';

			return order.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('4 - should be able to save order with one request with one item without problems', function(done) {
			var request = {
				user: user,
				items: [ {item: item1, quantity: 1} ]
			};

			order.addRequest (request);

			return order.save(function(err) {
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

		it('5 - should be able to save order with one request with nevative quantity without problems', function(done) {
			var request = {
				user: user,
				items: [ {item: item1, quantity: -1} ]
			};

			order.addRequest (request);

			return order.save(function(err) {
				should.not.exist(err);

				(order.requests).should.be.an.Array.with.lengthOf(1);
				(order.requests[0]).should.have.properties('_id', 'user', 'requestDate', 'items');

				(order.requests[0].items).should.be.an.Array.with.lengthOf(1);
				(order.requests[0].items[0].quantity).should.match(request.items[0].quantity);

				done();
			});
		});

		it('6 - should be able to save order with one requests with many items without problems', function(done) {
			var request = {
				user: user,
				items: [
						{item: item1, quantity: 1},
						{item: item2, quantity: 3}
				]
			};

			order.addRequest (request);

			return order.save(function(err) {
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

		it('7 - should be able to save order with many requests without problems', function(done) {
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
			order.addRequest (request1);
			order.addRequest (request2);

			// Register manager user.
			return order.save(function(err) {
				should.not.exist(err);

				(order.requests).should.be.an.Array.with.lengthOf(2);

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

				// Add request 3 after save the order
				order.addRequest (request3);

				order.save(function(err) {
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

		it('8 - should be able to calculate summary with 0 requests without problems', function(done) {
			order.calculateSummary();

			// Register manager user.
			return order.save(function(err) {
				should.not.exist(err);

				(order).should.have.properties('_id', 'user', 'requests', 'summary');
				(order.requests).should.be.an.Array.with.lengthOf(0);
				(order.summary).should.be.an.Array.with.lengthOf(0);

				done();
			});
		});

		it('9 - should be able to calculate summary with 1 request without problems', function(done) {
			var request = {
				items: [
						{item: item1, quantity: 1},
						{item: item2, quantity: 5}
				]
			};

			// Add request to the order and calculate summary.
			order.addRequest (request);
			order.calculateSummary();

			// Register manager user.
			return order.save(function(err) {
				should.not.exist(err);

				(order).should.have.properties('_id', 'user', 'requests', 'summary');
				(order.requests).should.be.an.Array.with.lengthOf(1);
				(order.summary).should.be.an.Array.with.lengthOf(2);

				done();
			});
		});

		it('10 - should be able to calculate summary with many request without problems', function(done) {
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
			order.addRequest (request1);
			order.addRequest (request2);
			order.calculateSummary();

			// Add request 3. The summary should be update automatically.
			order.addRequest (request3);
			//order.calculateSummary();

			// Register manager user.
			return order.save(function(err) {
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

		it('11 - should be able to remove previous request without problems', function(done) {
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
			order.addRequest (request1);
			order.addRequest (request2);
			order.addRequest (request3);
			order.calculateSummary();

			// Register manager user.
			return order.save(function(err) {
				should.not.exist(err);

				(order).should.have.properties('_id', 'user', 'requests', 'summary');
				(order.requests).should.be.an.Array.with.lengthOf(3);
				(order.summary).should.be.an.Array.with.lengthOf(3);

				(order.summary[0].quantity).should.match(2);
				(order.summary[1].quantity).should.match(2);
				(order.summary[2].quantity).should.match(2);

				// Remove request 2
				order.removeRequest (order.requests[1]._id);
				// Remove request 3
				order.removeRequest (order.requests[1]._id);

				order.save(function(err) {
					(order.requests).should.be.an.Array.with.lengthOf(1);
					(order.summary).should.be.an.Array.with.lengthOf(2);

					(order.summary[0].quantity).should.match(1);
					(order.summary[1].quantity).should.match(1);

					done();
				});
			});
		});
	});

	afterEach(function(done) {
		Order.remove().exec();
		Item.remove().exec();
		Groupbuy.remove().exec();
		User.remove().exec();

		done();
	});
});