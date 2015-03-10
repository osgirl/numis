'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Currency = mongoose.model('Currency');

/**
 * Globals
 */
var currency, currency2;

/**
 * Unit tests
 */
describe('Currency Model Unit Tests:', function() {
	beforeEach(function(done) {
		currency = new Currency({
			name: 'Euro',
			code: 'EUR',
			symbol: '€'
		});

		currency2 = new Currency({
			name: 'US Dollar',
			code: 'USD',
			symbol: '$'
		});

		// Remove old previous data
		Currency.remove().exec(done);
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


	describe('Method Save', function() {
		it('NU_P_G000_E001: should be able to save without problems', function(done) {
			return currency.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('NU_P_G000_E002: should be able to save two currencies without problems', function(done) {
			return currency.save(function(err) {
				should.not.exist(err);

				currency2.save(function(err) {
					should.not.exist(err);

					done();
				});
			});
		});

		it('NU_P_G000_E003: should be able to show an error when try to save without name', function(done) {
			currency.name = '';

			return currency.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_P_G000_E004: should be able to show an error when try to save without code', function(done) {
			currency.name = '';

			return currency.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_P_G000_E005: should be able to show an error when try to save without symbol', function(done) {
			currency.name = '';

			return currency.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_P_G000_E006: should be able to show an error when try to save 2 currencies with same name', function(done) {
			currency2.name = currency.name;

			return currency.save(function(err) {
				should.not.exist(err);

				currency2.save(function(err) {
					should.exist(err);

					done();
				});
			});
		});

		it('NU_P_G000_E007: should be able to show an error when try to save 2 currencies with same code', function(done) {
			currency2.code = currency.code;

			return currency.save(function(err) {
				should.not.exist(err);

				currency2.save(function(err) {
					should.exist(err);

					done();
				});
			});
		});

		it('NU_P_G000_E008: should be able to show an error when try to save a Currency with less 3-characters currency code', function(done) {
			currency.code = 'EU';

			return currency.save(function(err) {
				should.exist(err);
				done();
			});
		});


		it('NU_P_G000_E009: should be able to show an error when try to save a Currency with more 3-characters currency code', function(done) {
			currency.code = 'EURO';

			return currency.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_P_G000_E010: should be able to save a Currency with leading and trailing white spaces', function(done) {
			currency.code = ' EUR ';

			return currency.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

	});

});