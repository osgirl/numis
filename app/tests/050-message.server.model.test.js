'use strict';

/**
 * Module dependencies.
 */
var should   = require('should'),
	mongoose = require('mongoose'),
	User     = mongoose.model('User'),
	Groupbuy = mongoose.model('Groupbuy'),
	Message  = mongoose.model('Message');

/**
 * Globals
 */
var member, manager, groupbuy, message;

/**
 * Unit tests
 */
describe('Message Model Unit Tests:', function() {
	before(function(done) {
		// Remove old previous data
		Message.remove().exec();
		Groupbuy.remove().exec();
		User.remove().exec();

		member = new User({
			firstName: 'Member',
			lastName:  '1',
			email:     'member1@example.net',
			username:  'member1',
			password:  'password',
			provider:  'local'
		});

		manager = new User({
			firstName: 'Manager',
			lastName:  '4',
			email:     'manager4@example.net',
			username:  'manager4',
			password:  'password',
			provider:  'local'
		});

		groupbuy = new Groupbuy({
			title: 'Groupbuy #1',
			description: 'Lorem ipsum dolor sit amet...',
			user: manager
		});

		member.save(function(err) {
			if (err) console.error(err);

			manager.save(function(err) {
				if (err) console.error(err);

				groupbuy.addMember(member, function(err) {
					if (err) console.error(err);

					done();
				});
			});
		});

	});

	beforeEach(function(done) {
		message = new Message({
			groupbuy: groupbuy,
			from:     member,
			to:       manager,
			text:     'Text 1'
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
		it('NU_P_G005_E001: should be able to save without problems', function(done) {
			return message.save(function(err) {
				should.not.exist(err);

				done();
			});
		});

		it('NU_P_G005_E002: should be able to show an error when try to save without groupbuy', function(done) {
			message.groupbuy = '';

			return message.save(function(err) {
				should.exist(err);

				done();
			});
		});

		it('NU_P_G005_E003: should be able to show an error when try to save without sender', function(done) {
			message.from = '';

			return message.save(function(err) {
				should.exist(err);

				done();
			});
		});

		it('NU_P_G005_E004: should be able to show an error when try to save without receiver', function(done) {
			message.to = '';

			return message.save(function(err) {
				should.exist(err);

				done();
			});
		});

		it('NU_P_G005_E005: should be able to show an error when try to save without text', function(done) {
			message.text = '';

			return message.save(function(err) {
				should.exist(err);

				done();
			});
		});
	});

});