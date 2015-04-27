'use strict';

/**
 * Module dependencies.
 */
var mongoose     = require('mongoose'),
	core         = require('./core.server.controller'),
	errorHandler = require('./errors.server.controller'),
	Message      = mongoose.model('Message'),
	_            = require('lodash');


/**
 * Formatting messages list to send
 */
var formattingMessageList = exports.formattingMessageList = function(messages, req) {
	var selfURL = (typeof req.url !== 'undefined') ? req.url : '';

	var result = {
		_links: {
			self: { href: selfURL }
		},
		_embedded: {
			messages: []
		}
	};

	// Adding embedded items
	for (var i = 0; i < messages.length; i++) {
		result._embedded.messages.push(
			{
				_id:  messages[i]._id,
				from: messages[i].from.username,
				to:   (messages[i].to) ? messages[i].to.username : '',
				text: messages[i].text,
				date: messages[i].created
			}
		);
	}

	// Send response
	return result;
};


/**
 * Create a Message
 */
exports.create = function(req, res) {
	var message = new Message({
			groupbuy: req.groupbuy,
			from:     req.user,
			text:     req.body.text,
			timedate: new Date(),
			unread:   true
	});

	// If 'from' is a manager, 'to' must be a member
	if (req.groupbuy.isManager(req.user.id) && req.groupbuy.isMember(req.body.to) ) {
		message.to = req.body.to;

	// If 'from' is a member, 'to' must be a null (all managers)
	} else if (req.groupbuy.isMember(req.user.id) ) {
		message.to = null;

	} else {
		return res.status(400).send(errorHandler.prepareErrorResponse (new Error('Invalid sender or receiver.')) );
	}

	message.save(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};


/**
 * Delete an Message
 */
exports.delete = function(req, res) {
	var message = req.message ;

	message.remove(function(err) {
		if (err) {
			return res.status(400).send( errorHandler.prepareErrorResponse (err) );
		} else {
			res.status(204).end();
		}
	});
};

/**
 * List of Messages by user in a groupbuy
 */
exports.list = function(req, res) {
	var memberId, query;

	if (req.profile !== undefined && typeof req.profile._id !== 'undefined') {
		memberId = req.profile._id;
	} else {
		memberId = req.user._id;
	}

	query = {
		$and: [
			{ groupbuy: req.groupbuy.id },
			{ $or: [
				{ from: memberId },
				{ to:   memberId }
			]}
		]
	};

	Message.find(query).sort('created').populate('from', 'username').populate('to', 'username').exec(function(err, messages) {
		if (err) {
			return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
		} else {
			// Return messages
			res.jsonp( formattingMessageList(messages, req) );
			// Mark messages received as readed
			Message.markAsRead(req.groupbuy.id, req.user._id);
		}
	});
};

/**
 * List of All unread Messages by an user
 */
exports.listRecent = function(req, res) {
	var sort   = req.query.sort || 'unread created',
		limit  = req.query.limit || 5;

	Message.aggregate([
	  	{$match: {to: req.profile._id, unread: true} },
	   	{$group: {_id: null, groupbuy: {'$first': '$groupbuy'}, unread: {$sum: 1}} },
	   	//{$project: {_id: 0, groupbuy: 1, unread: 1} }
	], function(err, results) {
		if (err) {
			return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
		} else {
			//res.jsonp( results );

			Message.populate(results, {path: 'groupbuy', select: 'title'}, function(err, messages) {
				if (err)
					return res.status(400).send({ message: errorHandler.getErrorMessage(err) });

				// Return messages
				res.jsonp( messages );
			});
		}
	});
};


/**
 * Mark as read all Messages of a member
 */
exports.markAsRead = function(req, res) {
	Message.markAsRead(req.groupbuy._id, req.user._id, function(err) {
		if (err) {
			return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
		} else {
			res.status(204).end();
		}
	});
};


/**
 * Message middleware
 */
exports.messageByID = function(req, res, next, id) {
	Message.findById(id).exec(function(err, message) {
		if (err) return next(err);
		if (!message) return next(new Error('Failed to load Message ' + id));

		req.message = message;
		next();
	});
};
