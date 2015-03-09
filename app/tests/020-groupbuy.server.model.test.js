'use strict';

/**
 * Module dependencies.
 */
var should   = require('should'),
	mongoose = require('mongoose'),
	User     = mongoose.model('User'),
	Currency = mongoose.model('Currency'),
	Groupbuy = mongoose.model('Groupbuy');

/**
 * Globals
 */
var user, groupbuy, groupbuy2;

/**
 * Unit tests
 */
describe('Groupbuy Model Unit Tests:', function() {
	before(function(done) {
		var currency = new Currency({
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
		Groupbuy.remove().exec();
		User.remove().exec();

		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password',
			provider: 'local'
		});

		user.save(function(err) {
			if (err) console.error(err);

			groupbuy = new Groupbuy({
				title: 'Groupbuy Title',
				description: 'Groupbuy Description',
				manager: [user],
				member: [user],
				user: user
			});

			groupbuy2 = new Groupbuy({
				title: 'Groupbuy-Title',
				description: 'Groupbuy Description',
				manager: [user],
				member: [user],
				user: user
			});

			done();
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
		it('NU_P_G002_E001: should be able to save without problems', function(done) {
			return groupbuy.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('NU_P_G002_E002: should be able to show an error when try to save without title', function(done) {
			groupbuy.title = '';

			return groupbuy.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_P_G002_E003: should fail to save an existing groupbuy again', function(done) {
			groupbuy.save(function(err) {
				if (err) console.error(err);

				return groupbuy.save(function(err) {
					should.not.exist(err);
					done();
				});
			});
		});

		it('NU_P_G002_E004: should be able to save two groupbuys with similar title and same name (slug) beginning', function(done) {
			groupbuy.save(function(err) {
				if (err) console.error(err);

				return groupbuy2.save(function(err) {
					should.not.exist(err);
					done();
				});
			});
		});

	});

});