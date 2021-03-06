'use strict';

/**
 * Module dependencies.
 */
var should   = require('should'),
	mongoose = require('mongoose'),
	User     = mongoose.model('User'),
	Currency = mongoose.model('Currency'),
	Groupbuy = mongoose.model('Groupbuy'),
	Item     = mongoose.model('Item');

/**
 * Globals
 */
var user1, currency, groupbuy1, groupbuy2, item1;

/**
 * Unit tests
 */
describe('Item Model Unit Tests:', function(done) {
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

		user1 = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: 'username',
			password: 'password',
			provider: 'local'
		});

		user1.save(function(err) {
			if (err) console.error(err);

			groupbuy1 = new Groupbuy({
				title: 'Groupbuy #1',
				description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras semper suscipit velit, hendrerit fringilla purus mollis vitae. Praesent auctor non lectus ac consectetur. Maecenas quis consequat quam. Nullam sed feugiat neque. In hendrerit sagittis lacinia. Proin venenatis leo quis orci ultrices facilisis. Morbi rutrum augue vel est accumsan feugiat. Vestibulum interdum tincidunt metus in lobortis.<br/><br/>Integer blandit dui ut scelerisque iaculis. Aliquam fringilla pulvinar cursus. Sed porttitor laoreet nunc a ultrices. Ut ac gravida turpis. Proin a ipsum sed erat tempor ultrices in vitae sem. Quisque auctor ex ante, at semper magna rutrum at. Nunc non maximus metus, in rutrum ligula. Nullam accumsan at ante sed ornare. Suspendisse est sem, varius eu mi eu, bibendum finibus neque. Sed vehicula malesuada velit. Maecenas ut augue ligula. Cras blandit libero ut lobortis ornare. Cras varius varius vestibulum.<br/><br/>Nulla a hendrerit enim. Nunc consequat dolor nec orci aliquet, a tempor dolor consequat. Donec elementum nisi lacus, ut cursus nibh facilisis vel. Mauris eget sapien porttitor, elementum dui condimentum, luctus lacus. Aenean quis volutpat lectus. Aenean porta iaculis egestas. Aenean sollicitudin tincidunt interdum.<br/><br/>In maximus nunc sit amet felis molestie, ut imperdiet nunc tincidunt. Etiam in magna quis velit commodo euismod a at elit. Mauris tristique elementum lobortis. Phasellus posuere sollicitudin justo, et rutrum urna varius at. Vivamus facilisis nulla sem, pellentesque maximus lorem bibendum sed. Phasellus aliquet leo a nibh tincidunt ultrices. Nulla a venenatis tortor, accumsan egestas dolor.<br/><br/>Fusce vestibulum lacinia neque quis imperdiet. Curabitur ultricies diam eu tellus maximus vestibulum. Curabitur bibendum turpis vitae lorem fermentum aliquet. Morbi vel odio neque. Cras et dignissim massa, nec aliquam leo. In egestas ut dui eu sodales. In vel sagittis urna, ullamcorper imperdiet ligula. Sed nec malesuada augue, quis facilisis sapien.',
				user: user1
			});

			groupbuy2 = new Groupbuy({
				title: 'Groupbuy #2',
				description: 'Buscar información en <a href="https://www.google.es/">Google</a>',
				user: user1
			});

			groupbuy1.save(function(err) {
				if (err) console.error(err);

				groupbuy2.save(function(err) {
					if (err) console.error(err);

					item1 = new Item({
						title: 'Item Title',
						description: 'Description',
						price: 100,
						currency: currency.id,
						groupbuy: groupbuy1,
						user: user1
					});

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


	describe('Method Save', function() {
		it('NU_P_G003_E001: should be able to save an Item without problems', function(done) {
			return item1.save(function(err) {
				should.not.exist(err);
				done();
			});
		});

		it('NU_P_G003_E002: should be able to show an error when try to save an Item without title', function(done) {
			item1.title = '';

			return item1.save(function(err) {
				should.exist(err);
				done();
			});
		});

        it('NU_P_G003_E003: should be able to show an error when try to save an Item without user creator', function(done) {
            item1.user = undefined;

            return item1.save(function(err) {
                should.exist(err);
                done();
            });
        });

        it('NU_P_G003_E004: should be able to show an error when try to save an Item without Groupbuy', function(done) {
            item1.groupbuy = undefined;

            return item1.save(function(err) {
                should.exist(err);
                done();
            });
        });

        it('NU_P_G003_E005: should be able to show an error when try to save an Item item with negative price', function(done) {
            item1.price = -1;

            return item1.save(function(err) {
                should.exist(err);
                done();
            });
        });

        it('NU_P_G003_E006: should be able to save an item with floating price with 2 decimal places', function(done) {
            item1.price = 4.56;

            return item1.save(function(err) {
                should.not.exist(err);

                item1.price.should.equal(4.56);

                done();
            });
        });

        it('NU_P_G003_E007: should be able to save an item with floating price with more than 2 decimal places', function(done) {
            item1.price = 4.567890;

            return item1.save(function(err) {
                should.not.exist(err);

                item1.price.should.equal(4.57);

                done();
            });
        });

		it('NU_P_G003_E008: should not be able to save two items with same title in the same groupbuy', function(done) {
			var item2 = new Item({
				title: 'Item Title',
				description: 'Description 2',
				price: 1,
				groupbuy: groupbuy1,
				user: user1
			});

            item1.save(function(err) {
                should.not.exist(err);

				return item2.save(function(err) {
					should.exist(err);

                	done();
				});
            });
        });

		it('NU_P_G003_E009: should be able to save two items with same title in diferent groupbuys', function(done) {
			var item2 = new Item({
				title: 'Item Title',
				description: 'Description 2',
				price: 1,
				groupbuy: groupbuy2,
				user: user1
			});

            item1.save(function(err) {
                should.not.exist(err);

				return item2.save(function(err) {
					should.not.exist(err);

                	done();
				});
            });
        });

	});
});