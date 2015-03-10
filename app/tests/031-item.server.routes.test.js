'use strict';

var should   = require('should'),
	request  = require('supertest'),
	app      = require('../../server'),
	mongoose = require('mongoose'),
	User 	 = mongoose.model('User'),
	Currency = mongoose.model('Currency'),
	Groupbuy = mongoose.model('Groupbuy'),
	Item     = mongoose.model('Item'),
	agent    = request.agent(app);

/**
 * Globals
 */
var credentials, currency, user1, groupbuy1, groupbuy2, item1;

/**
 * Item routes tests
 */
describe('Item CRUD tests', function() {
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
		// Remove old previous data
		Item.remove().exec();
		Groupbuy.remove().exec();
		User.remove().exec();

		// Create user credentials
		credentials = {
			username: 'username1',
			password: 'password1'
		};

		user1 = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Save a user and 2 groupbuys to the test db
		user1.save(function(err) {
			if (err) console.error(err);

			groupbuy1 = new Groupbuy({
				title: 'Groupbuy A',
				description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras semper suscipit velit, hendrerit fringilla purus mollis vitae. Praesent auctor non lectus ac consectetur. Maecenas quis consequat quam. Nullam sed feugiat neque. In hendrerit sagittis lacinia. Proin venenatis leo quis orci ultrices facilisis. Morbi rutrum augue vel est accumsan feugiat. Vestibulum interdum tincidunt metus in lobortis.<br/><br/>Integer blandit dui ut scelerisque iaculis. Aliquam fringilla pulvinar cursus. Sed porttitor laoreet nunc a ultrices. Ut ac gravida turpis. Proin a ipsum sed erat tempor ultrices in vitae sem. Quisque auctor ex ante, at semper magna rutrum at. Nunc non maximus metus, in rutrum ligula. Nullam accumsan at ante sed ornare. Suspendisse est sem, varius eu mi eu, bibendum finibus neque. Sed vehicula malesuada velit. Maecenas ut augue ligula. Cras blandit libero ut lobortis ornare. Cras varius varius vestibulum.<br/><br/>Nulla a hendrerit enim. Nunc consequat dolor nec orci aliquet, a tempor dolor consequat. Donec elementum nisi lacus, ut cursus nibh facilisis vel. Mauris eget sapien porttitor, elementum dui condimentum, luctus lacus. Aenean quis volutpat lectus. Aenean porta iaculis egestas. Aenean sollicitudin tincidunt interdum.<br/><br/>In maximus nunc sit amet felis molestie, ut imperdiet nunc tincidunt. Etiam in magna quis velit commodo euismod a at elit. Mauris tristique elementum lobortis. Phasellus posuere sollicitudin justo, et rutrum urna varius at. Vivamus facilisis nulla sem, pellentesque maximus lorem bibendum sed. Phasellus aliquet leo a nibh tincidunt ultrices. Nulla a venenatis tortor, accumsan egestas dolor.<br/><br/>Fusce vestibulum lacinia neque quis imperdiet. Curabitur ultricies diam eu tellus maximus vestibulum. Curabitur bibendum turpis vitae lorem fermentum aliquet. Morbi vel odio neque. Cras et dignissim massa, nec aliquam leo. In egestas ut dui eu sodales. In vel sagittis urna, ullamcorper imperdiet ligula. Sed nec malesuada augue, quis facilisis sapien.',
				manager: [user1.id],
				member: [user1.id],
				user: user1.id
			});

			groupbuy2 = new Groupbuy({
				title: 'Groupbuy B',
				description: 'Buscar información en <a href="https://www.google.es/">Google</a>',
				manager: [user1.id],
				member: [user1.id],
				user: user1.id
			});

			groupbuy1.save(function(err) {
				if (err) console.error(err);

				groupbuy2.save(function(err) {
					if (err) console.error(err);

					// Create two Items to Groupbuy 1
					item1 = {
						title: 'Item A1',
						description: 'Description A1',
						price: 22.34,
						currency: currency.id,
						user: user1._id
					};

					// Call the assertion callback
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


	it('NU_P_G003_E101: should be able to save Item instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var GroupbuyId = groupbuy1._id;

				// Save a new Item
				agent.post('/api/v1/groupbuys/' + GroupbuyId + '/items')
					.send(item1)
					.expect(201)
					.end(function(itemSaveErr, itemSaveRes) {
						// Handle Item save error
						if (itemSaveErr) done(itemSaveErr);

						(itemSaveRes.body).should.have.property('_id');
						(itemSaveRes.body.title).should.match(item1.title);
						(itemSaveRes.body.description).should.match(item1.description);
						(itemSaveRes.body.price).should.match(item1.price);
						(itemSaveRes.body.currency._id).should.match(item1.currency);

						// Get a list of Items
						agent.get('/api/v1/groupbuys/' + GroupbuyId + '/items')
							.end(function(itemsGetErr, itemsGetRes) {
								// Handle Item save error
								if (itemsGetErr) done(itemsGetErr);

								// Get Items list
								var items = itemsGetRes.body._embedded.items;

								// Set assertions
								items.should.be.an.Array.with.lengthOf(1);
								(items[0].title).should.match(item1.title);
								(items[0].name).should.match(itemSaveRes.body.name);
								(items[0].description).should.match(item1.description);
								(items[0].price).should.match(item1.price);
								(items[0].currency._id).should.match(item1.currency);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G003_E102: should not be able to save Item instance if not logged in', function(done) {
		var GroupbuyId = groupbuy1._id;

		agent.get('/auth/signout')
			.expect(302)	// Redirect to '/'
			.end(function(signoutErr, signoutRes) {
				// Handle signin error
				if (signoutErr) done(signoutErr);

				// Save a new Item
				agent.post('/api/v1/groupbuys/' + GroupbuyId + '/items')
					.send(item1)
					.expect(401)
					.end(function(itemSaveErr, itemSaveRes) {
						// Set message assertion
						(itemSaveRes.body.name).should.match('NotLogged');

						// Call the assertion callback
						done(itemSaveErr);
					});
			});
	});

	it('NU_P_G003_E103: should not be able to save Item instance if no title is provided', function(done) {
		var GroupbuyId = groupbuy1._id;

		// Invalidate name field
		item1.title = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Item
				agent.post('/api/v1/groupbuys/' + GroupbuyId + '/items')
					.send(item1)
					.expect(400)
					.end(function(itemSaveErr, itemSaveRes) {
						// Set message assertion
						(itemSaveRes.body.name).should.match('ValidationError');
						(itemSaveRes.body.errors.title.path).should.match('title');
						(itemSaveRes.body.errors.title.type).should.match('required');
						(itemSaveRes.body.errors.title.message).should.match('Please fill Item title');

						// Handle Item save error
						done(itemSaveErr);
					});
			});
	});

	it('NU_P_G003_E104: should be able to update Item instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var GroupbuyId = groupbuy1._id;

				// Save a new Item
				agent.post('/api/v1/groupbuys/' + GroupbuyId + '/items')
					.send(item1)
					.expect(201)
					.end(function(itemSaveErr, itemSaveRes) {
						// Handle Item save error
						if (itemSaveErr) done(itemSaveErr);

						(itemSaveRes.body).should.have.property('_id');
						(itemSaveRes.body.title).should.match(item1.title);
						(itemSaveRes.body.description).should.match(item1.description);
						(itemSaveRes.body.price).should.match(item1.price);
						(itemSaveRes.body.currency._id).should.match(item1.currency);

						// Update Item name
						item1.title = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Item
						agent.put('/api/v1/groupbuys/' + GroupbuyId + '/items/' + itemSaveRes.body._id)
							.send(item1)
							.expect(200)
							.end(function(itemUpdateErr, itemUpdateRes) {
								// Handle Item update error
								if (itemUpdateErr) done(itemUpdateErr);

								// Set assertions
								//(itemUpdateRes.body).should.be.an.Object.not.be.empty;
								(itemUpdateRes.body).should.have.propertyByPath('_links', 'self', 'href');
								(itemUpdateRes.body).should.have.propertyByPath('_links', 'image', 'href');
								(itemUpdateRes.body).should.have.propertyByPath('_links', 'groupbuy', 'href');
								(itemUpdateRes.body).should.have.propertyByPath('_links', 'creator', 'href');

								(itemUpdateRes.body).should.have.properties('_id', 'title', 'name', 'description', 'price', 'currency');
								(itemUpdateRes.body._id).should.match(itemSaveRes.body._id);
								(itemUpdateRes.body.description).should.match(itemSaveRes.body.description);
								(itemUpdateRes.body.price).should.match(itemSaveRes.body.price);
								(itemUpdateRes.body.currency).should.match(itemSaveRes.body.currency);

								(itemUpdateRes.body.title).should.match(item1.title);

								// Call the assertion callback
								done();

							});
					});
			});
	});

	it('NU_P_G003_E105: should not be able to get a list of Items if not signed in', function(done) {
		// Create new Item model instance
		var itemObj = new Item(item1);
		itemObj.groupbuy = groupbuy1.id;

		// Save the Item
		itemObj.save(function(err) {
			if (err) console.error(err);

			// Request Items
			request(app).get('/api/v1/groupbuys/' + itemObj.groupbuy + '/items')
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

	it('NU_P_G003_E106: should not be able to get a single Item if not signed in', function(done) {
		// Create new Item model instance
		var itemObj = new Item(item1);
		itemObj.groupbuy = groupbuy1.id;

		// Save the Item
		itemObj.save(function(err) {
			if (err) console.error(err);

			request(app).get('/api/v1/groupbuys/' + itemObj.groupbuy + '/items/' + itemObj._id)
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

	it('NU_P_G003_E107: should be able to delete Item instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				var GroupbuyId = groupbuy1.id;

				// Save a new Item
				agent.post('/api/v1/groupbuys/' + GroupbuyId + '/items')
					.send(item1)
					.expect(201)
					.end(function(itemSaveErr, itemSaveRes) {
						// Handle Item save error
						if (itemSaveErr) done(itemSaveErr);

						// Delete existing Item
						agent.delete('/api/v1/groupbuys/' + GroupbuyId + '/items/' + itemSaveRes.body._id)
							.expect(204)
							.end(function(itemDeleteErr, itemDeleteRes) {
								// Handle Item error error
								if (itemDeleteErr) {
									done(itemDeleteErr);
								} else {
									// Set assertions
									//(itemDeleteRes.body).should.be.empty;

									// Call the assertion callback
									done();
								}
							});
					});
			});
	});

	it('NU_P_G003_E108: should not be able to delete Item instance if not signed in', function(done) {
		// Create new Item model instance
		var itemObj = new Item(item1);
		itemObj.user = user1;
		itemObj.groupbuy = groupbuy1.id;

		// Save the Item
		itemObj.save(function(err) {
			if (err) console.error(err);

			// Try deleting Item
			request(app).delete('/api/v1/groupbuys/' + itemObj.groupbuy + '/items/' + itemObj._id)
				.expect(401)
				.end(function(itemDeleteErr, itemDeleteRes) {
					// Set message assertion
					(itemDeleteRes.body.message).should.match('User is not logged in');

					// Handle Item error error
					done(itemDeleteErr);
				});

		});
	});

});