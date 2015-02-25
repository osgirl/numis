'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
	mongoose = require('mongoose'),
	User = mongoose.model('User');

/**
 * Globals
 */
var user, user2, user3;

/**
 * Unit tests
 */
describe('User Model Unit Tests:', function() {
	before(function(done) {
		// Remove old previous data
		User.remove().exec();

		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@example.net',
			username: 'username',
			password: 'password',
			provider: 'local'
		});

		user2 = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@example.net',
			username: 'username',
			password: 'password',
			provider: 'local'
		});

		user3 = new User({
			firstName: 'John',
			lastName: 'Doe',
			email: 'jdoe@example.net',
			username: 'jdoe',
			password: 'password',
			provider: 'local',
			homeAddress: 'Fake Street 123, 22150 Springfiled, Virginia USA'
		});

		done();
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
	 *              05 - Mesenger
	 *
	 *          a) Subgroup (in Server side):
	 *              0 - Mongoose
	 *              1 - REST API
	 *              2 - Pagination, sorting and filtering
	 *              3 - Permission
	 *
	 *          bb) Test number
	 */


	describe('Method Find', function() {
		it('NU_P_G001_E001: should begin with no users', function(done) {
			User.find({}, function(err, users) {
				should.not.exist(err);

				users.should.have.length(0);
				done();
			});
		});

	});

	describe('Method Save', function() {
		it('NU_P_G001_E011: should be able to save user without problems', function(done) {
			user.save(done);
		});

		it('NU_P_G001_E012: should be able to save user with home address without problems', function(done) {
			user3.save(done);
		});

		it('NU_P_G001_E013: should fail to save an existing user again', function(done) {
			user.save(function(err) {
				return user2.save(function(err) {
					should.exist(err);
					done();
				});
			});
		});

		it('NU_P_G001_E014: should be able to show an error when try to save without first name', function(done) {
			user.firstName = '';
			return user.save(function(err) {
				should.exist(err);
				done();
			});
		});
	});

});