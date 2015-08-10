'use strict';
var config = require('config');
var utilities = require('./lib/app-utilities.js');
var debug = require('debug')('mailsac-smtp');

var sanitize = require('sanitizer').sanitize;
var htmlToText = require('html-to-text');
var async = require('async');

module.exports = function smtpFactory(mongoose, smtp, run_port, hooks) {
    var Message = mongoose.model('Message');

    function onMessageReceived(connection, dataReadyCallback) {
        debug('incoming message');

        function cleanupMessage(parsedMessage) {
            debug('cleanup message');

            debug('checking encryption of', connection.inbox);
            parsedMessage.originalInbox = connection.inbox+'';
            if (connection.inbox.slice(0, 6) === 'inbox-') {
                connection.inbox = utilities.decryptInbox(connection.inbox);
                debug('inbox was encrypted', connection.inbox);
            } else {
                debug('inbox was not encrypted', connection.inbox);
            }
            parsedMessage.inbox = connection.inbox.toLowerCase();
            parsedMessage.domain = connection.inbox.split('@')[1];
            parsedMessage.encryptedInbox = utilities.encryptInbox(parsedMessage.inbox);
            debug('inbox', parsedMessage.inbox);
            debug('encryptedInbox', parsedMessage.encryptedInbox);

            // parse html to text if no text
            if (!parsedMessage.text && parsedMessage.html) {
                debug('using html for text because text is missing');
                parsedMessage.text = htmlToText.fromString(parsedMessage.html, {
                    wordwrap: 130
                });
            }
            // parse text to html if no html
            var htmlizedText = '<html><head><meta http-equiv="content-type" content="text/html; charset=utf-8" /></head><body><div>'
                + (parsedMessage.text || '').replace(/(?:\r\n|\r|\n)/g, '<br />')
                + '</div></body></html>';
            parsedMessage.raw = connection.messageText;
            parsedMessage.received = new Date();
            // body is the sanitized html that is OK to display without warning
            if (!parsedMessage.html) {
                debug('using htmlizedText', htmlizedText);
                parsedMessage.html = htmlizedText;
                parsedMessage.body = sanitize(htmlizedText);
            } else {
                parsedMessage.body = sanitize(parsedMessage.html);
            }

            debug('text', parsedMessage.text);

            return parsedMessage;
        }

        utilities.parseRawMessage(connection.messageText, function afterParseMessage(err, parsedMessage) {

            if (err) {
                debug('PARSE FAIL', err.message, err.stack);
                return callback(new Error("Unable to parse raw mail"));
            }

            debug('message was parsed');

            new Message(cleanupMessage(parsedMessage)).save(onCreateNewMessage);

            function onCreateNewMessage(err, item) {
                if (err) {
                    debug('SAVE EMAIL FAIL', err.message, err.stack, '\n', parsedMessage);
                    return dataReadyCallback(new Error("Invalid email format"));
                }
                debug('message was saved', item._id);

                dataReadyCallback(null, "O"); // O is the queue id to be advertised to the client

                if (hooks.afterCreateMessage && hooks.afterCreateMessage.length) {
                    hooks.afterCreateMessage.forEach(function (hook) {
                        hook(item, parsedMessage);
                    });
                }
            }
        });
    };


    // Binding everything

    if (!smtp || !run_port) {
        return;
    }
    smtp.on("validateRecipient", function (connection, email, callback) {
        var emailValidated = utilities.ValidateEmail(email);
        if (!emailValidated) {
            debug('Invalid email addr', email);
            return callback(new Error("Invalid email addr"));
        }
        connection.full_email = email;
        connection.inbox = emailValidated;
        callback(false);
    });
    smtp.on("startData", function (connection) {
        connection.messageText = '';
    });
    // TODO: implement max size
    smtp.on("data", function (connection, chunk) {
        connection.messageText += chunk;
    });
    smtp.on("error", function (connection) {
        debug("Error from:", connection.from, 'to:', connection.to);
    });

    /**
     * client is finished passing e-mail data,
     * callback returns the queue id to the client
     */
    smtp.on("dataReady", onMessageReceived);

    smtp.listen(run_port, function (err) {
        if (err) {
            debug('Error starting SMTP', run_port, err);
            return;
        }
        debug('SMTP server listening', 'port', run_port);
    });

};
