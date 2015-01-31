'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy');

/**
 * Globals
 */
var user, groupbuy, groupbuy2;

/**
 * Unit tests
 */
describe('Groupbuy Model Unit Tests:', function() {
	beforeEach(function(done) {
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password'
		});

		user.save(function() {
			groupbuy = new Groupbuy({
				title: 'Groupbuy Title',
				description: 'Groupbuy Description',
				user: user
			});

			groupbuy2 = new Groupbuy({
				title: 'Groupbuy-Title',
				description: 'Groupbuy Description',
				user: user
			});

			done();
		});
	});

	describe('Method Save', function() {
		it('NU_T_G002_E001: should be able to save without problems', function(done) {
			return groupbuy.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('NU_T_G002_E002: should be able to show an error when try to save without title', function(done) {
			groupbuy.title = '';

			return groupbuy.save(function(err) {
				should.exist(err);
				done();
			});
		});

		it('NU_T_G002_E003: should fail to save an existing groupbuy again', function(done) {
			groupbuy.save();
			return groupbuy.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('NU_T_G002_E004: should be able to save two groupbuys with similar title and same name (slug) beginning', function(done) {
			groupbuy.save();
			return groupbuy2.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

	afterEach(function(done) {
		Groupbuy.remove().exec();
		User.remove().exec();

		done();
	});
});