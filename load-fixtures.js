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
    mongoose = require('mongoose');


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

    // 1st para in async.each() is the array of items
    async.each(currencies,
    // 2nd param is the function that each item is passed to
    function(currency, callback) {
        currency = new Currency(currency);

        currency.save(function(err, currency) {
            if (err) {
        		console.log(chalk.red(err));
            } else {
                console.log ('    ' + currency.name);
            }

            // Async call is done, alert via callback
            callback();
        });
    },
    // 3rd param is the function to call when everything's done
    function(err) {
        if (currenciesCallback) {
            currenciesCallback();
        }
    });
};


/*
 * Main code
 */
console.log(chalk.green('Start Loading fixtures!'));

console.log(chalk.green(' * Loading currencies...'));
loadCurrencies(function() {
    console.log(chalk.green(' * Currencies fixtures loaded.'));

    // Exit
    console.log(chalk.green('- End fixtures -'));
    process.exit();
});