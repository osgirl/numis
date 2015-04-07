'use strict';

/**
 * Module dependencies.
 */
var init     = require('./config/init')(),
    config   = require('./config/config'),
    chalk    = require('chalk'),
    fs       = require('fs'),
    path     = require('path'),
    async    = require('async'),
    mongoose = require('mongoose'),
    _ 	     = require('lodash');

var idCurrencies = {},
    idUsers      = {},
    idGroupbuys  = {},
    idItems      = {};


// Bootstrap db connection
var db = mongoose.connect(config.db, function(err) {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	}
});

// Globbing model files
config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
    require(path.resolve(modelPath));
});



/*
 * Load currency fixtures in DB
 */
var loadCurrencies = function(currenciesCallback) {
    var Currency = mongoose.model('Currency'),
        currencies = JSON.parse(fs.readFileSync('./fixtures/currencies.json', 'utf8')),
        currency,
        length = currencies.length;

    console.log(chalk.green(' * Loading currencies...'));

    // 1st para in async.each() is the array of items
    async.each(currencies,
    // 2nd param is the function that each item is passed to
    function(currency, callback) {
        currency = new Currency(currency);

        currency.save(function(err) {
            if (err) {
                if (err.message.indexOf('11000 E11000 duplicate key error') !== -1) {
                    // If the items exits get the id
                    Currency.findOne({code: currency.code}, 'id code name', function(err, currency) {
                        idCurrencies[currency.code] = currency.id;
                        console.log (chalk.blue('    >>> ' + currency.name));

                        // Async call is done, alert via callback
                        callback();
                    });
                } else {
                    console.log(chalk.red(err));

                    // Async call is done, alert via callback
                    callback();
                }
            } else {
                idCurrencies[currency.code] = currency.id;
                console.log ('    ' + currency.name);

                // Async call is done, alert via callback
                callback();
            }
        });
    },
    // 3rd param is the function to call when everything's done
    function(err) {
        console.log(chalk.green(' * Currencies fixtures loaded.'));

        if (currenciesCallback) {
            currenciesCallback();
        }
    });
};


/*
 * Load user fixtures in DB
 */
var loadUsers = function(usersCallback) {
    var User = mongoose.model('User'),
        users = JSON.parse(fs.readFileSync('./fixtures/users.json', 'utf8')),
        user,
        length = users.length;

    console.log(chalk.green(' * Loading users...'));

    // 1st para in async.each() is the array of items
    async.each(users,
    // 2nd param is the function that each item is passed to
    function(user, callback) {
        user = new User(user);

        user.save(function(err) {
            if (err) {
                if (err.message.indexOf('11000 E11000 duplicate key error') !== -1) {
                    // If the items exits get the id
                    User.findOne({'username': user.username}, 'id username', function(err, user) {
                        idUsers[user.username] = user.id;
                        console.log (chalk.blue('    >>> ' + user.username));

                        // Async call is done, alert via callback
                        callback();
                    });
                } else {
                    console.log(chalk.red(err));

                    // Async call is done, alert via callback
                    callback();
                }
            } else {
                idUsers[user.username] = user.id;
                console.log ('    ' + user.username);

                // Async call is done, alert via callback
                callback();
            }
        });
    },
    // 3rd param is the function to call when everything's done
    function(err) {
        console.log(chalk.green(' * Users fixtures loaded.'));

        if (usersCallback) {
            usersCallback();
        }
    });
};


/*
 * Load groupbuys fixtures in DB
 */
var loadGroupbuys = function(groupbuysCallback) {
    var Groupbuy = mongoose.model('Groupbuy'),
        groupbuys = JSON.parse(fs.readFileSync('./fixtures/groupbuys.json', 'utf8')),
        groupbuy,
        length = groupbuys.length;

    console.log(chalk.green(' * Loading groupbuys...'));

    // 1st para in async.each() is the array of items
    async.each(groupbuys,
    // 2nd param is the function that each item is passed to
    function(groupbuy, callback) {
        // Replace usernames by ids
        groupbuy.managers = _.map(groupbuy.managers, function(username) {
            return idUsers[username];
        });
        groupbuy.members = _.map(groupbuy.members, function(username) {
            return idUsers[username];
        });
        groupbuy.user = idUsers[groupbuy.user];

        // Replace currencies by ids
        groupbuy.currencies.local = idCurrencies[groupbuy.currencies.local];
        groupbuy.currencies.provider = idCurrencies[groupbuy.currencies.provider];

        // Find if groupbuy exists
        Groupbuy.findOne({name: groupbuy.name}, 'id name title', function(err, groupbuy2) {
            if (!err && groupbuy2) {
                idGroupbuys[groupbuy2.name] = groupbuy2.id;
                console.log (chalk.blue('    >>> ' + groupbuy2.title));

                // Async call is done, alert via callback
                callback();
            } else {
                // Save groupbuy
                groupbuy = new Groupbuy(groupbuy);

                groupbuy.save(function(err) {
                    if (err) {
                        console.log(chalk.red(err));
                    } else {
                        idGroupbuys[groupbuy.name] = groupbuy.id;
                        console.log ('    ' + groupbuy.title);
                    }

                    // Async call is done, alert via callback
                    callback();
                });
            }
        });
    },
    // 3rd param is the function to call when everything's done
    function(err) {
        console.log(chalk.green(' * Groupbuys fixtures loaded.'));

        if (groupbuysCallback) {
            groupbuysCallback();
        }
    });
};


/*
 * Load groupbuys fixtures in DB
 */
var loadItems = function(itemsCallback) {
    var Item = mongoose.model('Item'),
        items = JSON.parse(fs.readFileSync('./fixtures/items.json', 'utf8')),
        item,
        length = items.length;

    console.log(chalk.green(' * Loading items...'));

    // 1st para in async.each() is the array of items
    async.each(items,
    // 2nd param is the function that each item is passed to
    function(item, callback) {
        // Replace by IDs
        item.user     = idUsers[item.user];
        item.currency = idCurrencies[item.currency];
        item.groupbuy = idGroupbuys[item.groupbuy];

        // Find if groupbuy exists
        Item.findOne({title: item.title, groupbuy: item.groupbuy}, 'id title', function(err, item2) {
            if (!err && item2) {
                idItems[item2.title] = item2.id;
                console.log (chalk.blue('    >>> ' + item2.title));

                // Async call is done, alert via callback
                callback();
            } else {
                // Save groupbuy
                item = new Item(item);

                item.save(function(err) {
                    if (err) {
                        console.log(chalk.red(err));
                    } else {
                        idItems[item.title] = item.id;
                        console.log ('    ' + item.title);
                    }

                    // Async call is done, alert via callback
                    callback();
                });
            }
        });
    },
    // 3rd param is the function to call when everything's done
    function(err) {
        console.log(chalk.green(' * Items fixtures loaded.'));

        if (itemsCallback) {
            itemsCallback();
        }
    });
};



/*
 * Main code
 */
console.log(chalk.green('Start Loading fixtures!'));


loadCurrencies(function(err) {
    if (err) console.log(chalk.red(err));

    loadUsers(function(err) {
        if (err) console.log(chalk.red(err));

        loadGroupbuys(function(err) {
            if (err) console.log(chalk.red(err));

            loadItems(function(err) {
                if (err) console.log(chalk.red(err));

                // Exit
                console.log(chalk.green('- End fixtures -'));
                process.exit();
            });
        });
    });
});