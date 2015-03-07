'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Currency = mongoose.model('Currency'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, currency, currency2, currency3;

/**
 * Currency routes tests
 */
describe('Currency CRUD tests', function() {
	before(function(done) {
		// Remove old previous data
		Currency.remove().exec();
		User.remove().exec();

		// Create user credentials
		credentials = {
			username: 'username',
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
			roles: ['user', 'admin']
		});

		currency = new Currency({
			name: 'Euro',
			code: 'EUR',
			symbol: '€',
			priority: 100
		});

		currency2 = new Currency({
			name: 'US Dollar',
			code: 'USD',
			symbol: '$',
			priority: 99
		});

		currency3 = new Currency({
			name: 'British Pound',
			code: 'GBP',
			symbol: '£'
		});

		// Save a user to the test db and create new Currency
		user.save(function(err) {
			if (err) console.error(err);

			currency.save(function(err) {
				if (err) console.error(err);

				currency2.save(function(err) {
					if (err) console.error(err);

					currency3.save(function(err) {
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
	*              01 - Users
	*              02 - Groupbuys
	*              03 - Items
	*              04 - Orders
	*              05 - Messages
	*			   06 - Currencies
	*
	*          a) Subgroup (in Server side):
	*              0 - Mongoose
	*              1 - REST API
	*              2 - Pagination, sorting and filtering
	*              3 - Permissions
	*
	*          bb) Test number
	*/


	it('NU_P_G006_E101: should not be able to get a list of Currencies if not signed in', function(done) {
		agent.get('/api/v1/currencies')
			.expect(401)
			.end(function(currenciesGetErr, currenciesGetRes) {
				// Set assertion
				(currenciesGetRes.body.name).should.match('NotLogged');

				// Call the assertion callback
				done(currenciesGetErr);
			});
	});

	it('NU_P_G006_E102: should be able to get a list of Currencies if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a list of Currencies
				agent.get('/api/v1/currencies')
					.end(function(currenciesGetErr, currenciesGetRes) {
						// Handle Currency save error
						if (currenciesGetErr) done(currenciesGetErr);

						// Get Currencies list
						var currencies = currenciesGetRes.body._embedded.currencies;

						// Set assertions
						//(currenciesGetRes.body).should.be.an.Object.not.be.empty;
						(currenciesGetRes.body).should.have.propertyByPath('_links', 'self', 'href');

						currencies.should.be.an.Array.with.lengthOf(3);
						(currencies[0].name).should.match('Euro');
						(currencies[0].code).should.match('EUR');
						(currencies[0].symbol).should.match('€');
						(currencies[0]).should.not.have.properties('__v', 'enabled', 'priority');

						(currencies[1].name).should.match('US Dollar');
						(currencies[1].code).should.match('USD');
						(currencies[1].symbol).should.match('$');

						(currencies[2].name).should.match('British Pound');
						(currencies[2].code).should.match('GBP');
						(currencies[2].symbol).should.match('£');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G006_E103: should not be able to get a Currency info if not signed in', function(done) {
		agent.get('/api/v1/currencies/' + currency.id)
			.expect(401)
			.end(function(currencyGetErr, currencyGetRes) {
				// Set assertion
				(currencyGetRes.body.name).should.match('NotLogged');

				// Call the assertion callback
				done(currencyGetErr);
			});
	});

	it('NU_P_G006_E104: should be able to get a Currency if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get a Currency
				agent.get('/api/v1/currencies/' + currency.id)
					.expect(200)
					.end(function(currencyGetErr, currencyGetRes) {
						// Handle Currency save error
						if (currencyGetErr) done(currencyGetErr);

						// Set assertions
						(currencyGetRes.body).should.have.propertyByPath('_links', 'self', 'href');
						(currencyGetRes.body).should.not.have.properties('__v', 'enabled', 'priority');

						(currencyGetRes.body.name).should.match('Euro');
						(currencyGetRes.body.code).should.match('EUR');
						(currencyGetRes.body.symbol).should.match('€');

						// Call the assertion callback
						done();
					});
			});
	});

	it('NU_P_G006_E105: should not be able to save Currency instance', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				agent.post('/api/v1/currencies')
					.send(currency)
					.expect(404)
					.end(function(currencySaveErr, currencySaveRes) {
						// Call the assertion callback
						done(currencySaveErr);
					});
			});
	});

	it('NU_P_G006_E106: should not be able to update Currency instance', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Update existing Currency
				agent.put('/api/v1/currencies/' + currency.id)
					.send(currency)
					.expect(404)
					.end(function(currencyUpdateErr, currencyUpdateRes) {
						// Call the assertion callback
						done(currencyUpdateErr);
					});
			});
	});

	it('NU_P_G006_E107: should not be able to delete Currency instance', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Delete existing Currency
				agent.delete('/api/v1/currencies/' + currency.id)
					.send(currency)
					.expect(404)
					.end(function(currencyDeleteErr, currencyDeleteRes) {
						// Call the assertion callback
						done(currencyDeleteErr);
					});
			});
	});

	afterEach(function(done) {
		agent.get('/auth/signout')
			.expect(302)
			.end(done);
	});

});