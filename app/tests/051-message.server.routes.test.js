'use strict';

var should   = require('should'),
	request  = require('supertest'),
	app      = require('../../server'),
	mongoose = require('mongoose'),
	User     = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy'),
	Message  = mongoose.model('Message'),
	agent    = request.agent(app);

/**
 * Globals
 */
var credentials1, credentials2, credentials3, credentials4, credentials5, credentialsA;
var member1, member2, member3, manager4, manager5, admin, groupbuy, message;

/**
 * Messages routes tests
 */
describe('Message CRUD tests', function() {
	before(function(done) {
		// Remove old previous data
		Message.remove().exec();
		Groupbuy.remove().exec();
		User.remove().exec();

		// Create users credentials
		credentials1 = {
			username: 'member1',
			password: 'password'
		};
		credentials2 = {
			username: 'member2',
			password: 'password'
		};
		credentials3 = {
			username: 'member3',
			password: 'password'
		};
		credentials4 = {
			username: 'manager4',
			password: 'password'
		};
		credentials5 = {
			username: 'manager5',
			password: 'password'
		};
		credentialsA = {
			username: 'admin',
			password: 'password'
		};

		// Create users
		member1 = new User({
			firstName: 'Member',
			lastName: '1',
			email: 'member1@example.net',
			username: credentials1.username,
			password: credentials1.password,
			provider: 'local',
			roles: ['user']
		});

		member2 = new User({
			firstName: 'Member',
			lastName: '2',
			email: 'member2@example.net',
			username: credentials2.username,
			password: credentials2.password,
			provider: 'local',
			roles: ['user']
		});

		member3 = new User({
			firstName: 'Member',
			lastName: '3',
			email: 'member3@example.net',
			username: credentials3.username,
			password: credentials3.password,
			provider: 'local',
			roles: ['user']
		});

		manager4 = new User({
			firstName: 'Manager',
			lastName: '4',
			email: 'manager4@example.net',
			username: credentials4.username,
			password: credentials4.password,
			provider: 'local',
			roles: ['user']
		});

		manager5 = new User({
			firstName: 'Manager',
			lastName: '5',
			email: 'manager5@example.net',
			username: credentials5.username,
			password: credentials5.password,
			provider: 'local',
			roles: ['user']
		});

		admin = new User({
			firstName: 'Admin',
			lastName: 'Istrator',
			email: 'admin@example.net',
			username: credentialsA.username,
			password: credentialsA.password,
			provider: 'local',
			roles: ['user', 'admin']
		});

		// Create Groupbuy
		groupbuy = new Groupbuy({
			title: 'Groupbuy #1',
			description: 'Lorem ipsum dolor sit amet...',
			user: manager4
		});

		admin.save(function(err) {
			if (err) console.error(err);
			member1.save(function(err) {
				if (err) console.error(err);

				member2.save(function(err) {
					if (err) console.error(err);

					member3.save(function(err) {
						if (err) console.error(err);

						manager4.save(function(err) {
							if (err) console.error(err);

							manager5.save(function(err) {
								if (err) console.error(err);

								groupbuy.addManager(manager5, function(err) {
									if (err) console.error(err);

									groupbuy.addMember(member1, function(err) {
										if (err) console.error(err);

										groupbuy.addMember(member2, function(err) {
											if (err) console.error(err);

											groupbuy.addMember(member3, function(err) {
												if (err) console.error(err);

												groupbuy.addMember(admin, function(err) {
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
			});
		});

	});

	beforeEach(function(done) {
		// Remove old previous messages
		Message.remove().exec(done);

		message = {
			to:   manager4.id,
			text: 'Text 1'
		};
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
	 *              3 - Permissions
	 *
	 *          bb) Test number
	 */


	it('NU_P_G005_E101: should be able to save Message instance if logged in', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Message
				agent.post('/api/v1/groupbuys/' + groupbuy._id + '/messages')
					.send(message)
					.expect(204)
					.end(function(messagesSaveErr, messagesSaveRes) {
						// Handle Message save error
						if (messagesSaveErr) done(messagesSaveErr);

						// Get a list of Messages
						agent.get('/api/v1/groupbuys/' + groupbuy._id + '/messages')
							.expect(200)
							.end(function(messagesGetErr, messagesGetRes) {
								// Handle Messages save error
								if (messagesGetErr) done(messagesGetErr);

								// Set assertions
								//(messagesGetRes.body).should.be.an.Object.not.be.empty;
								(messagesGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
								(messagesGetRes.body._embedded.messages).should.be.an.Array.with.lengthOf(1);

								// Get Messagess list
								var messages = messagesGetRes.body._embedded.messages;
								(messages[0]).should.have.properties('_id', 'from', 'to', 'text', 'date');
								(messages[0].from).should.equal(member1.username);
								(messages[0].to).should.equal(''); // empty. DEstination are managers
								(messages[0].text).should.equal(message.text);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('NU_P_G005_E102: should not be able to save Message instance if not logged in', function(done) {
		agent.post('/api/v1/groupbuys/' + groupbuy._id + '/messages')
			.send(message)
			.expect(401)
			.end(function(messagesSaveErr, messagesSaveRes) {
				// Call the assertion callback
				(messagesSaveRes.body.name).should.match('NotLogged');

				// Call the assertion callback
				done(messagesSaveErr);
			});
	});

	it('NU_P_G005_E103: should not be able to save Messages instance if no text is provided', function(done) {
		// Invalidate receiver user
		message.text = '';

		agent.post('/api/v1/auth/signin')
			.send(credentials1)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Messages
				agent.post('/api/v1/groupbuys/' + groupbuy._id + '/messages')
					.send(message)
					.expect(400)
					.end(function(messagesSaveErr, messagesSaveRes) {
						// Set message assertion
						(messagesSaveRes.body.name).should.match('ValidationError');
						(messagesSaveRes.body.errors.text.path).should.match('text');
						(messagesSaveRes.body.errors.text.type).should.match('required');
						(messagesSaveRes.body.errors.text.message).should.match('Please fill message text.');

						// Handle Messages save error
						done(messagesSaveErr);
					});
			});
	});

	it('NU_P_G005_E104: should not be able to get a list of Messagess if not signed in', function(done) {
		// Create new Messages model instance
		var messagesObj = new Message(message);

		// Save the Messages
		messagesObj.save(function() {
			// Request Messagess
			request(app).get('/api/v1/groupbuys/' + groupbuy._id + '/messages')
				.expect(401)
				.end(function(messagesGetErr, messagesGetRes) {
					// Call the assertion callback
					(messagesGetRes.body.name).should.match('NotLogged');

					// Call the assertion callback
					done(messagesGetErr);
				});

		});
	});

	it('NU_P_G005_E105: should be able to delete Messages instance if have admin permission', function(done) {
		agent.post('/api/v1/auth/signin')
			.send(credentialsA)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Save a new Messages
				agent.post('/api/v1/groupbuys/' + groupbuy._id + '/messages')
					.send(message)
					.expect(204)
					.end(function(messagesSaveErr, messagesSaveRes) {
						// Handle Messages save error
						if (messagesSaveErr) done(messagesSaveErr);

						// Get a list of Messages
						agent.get('/api/v1/groupbuys/' + groupbuy._id + '/messages')
							.expect(200)
							.end(function(messagesGetErr, messagesGetRes) {
								// Handle Messages save error
								if (messagesGetErr) done(messagesGetErr);

								// Set assertions
								(messagesGetRes.body._embedded.messages).should.be.an.Array.with.lengthOf(1);

								var messageId = messagesGetRes.body._embedded.messages[0]._id;

								// Delete existing Message
								agent.delete('/api/v1/groupbuys/' + groupbuy._id + '/messages/' + messageId)
									.send(message)
									.expect(204)
									.end(function(messagesDeleteErr, messagesDeleteRes) {
										// Handle Messages error error
										if (messagesDeleteErr) done(messagesDeleteErr);

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