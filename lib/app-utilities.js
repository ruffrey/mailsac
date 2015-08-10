'use strict';
var crypto = require('crypto');
var config = require('config');
var MailParser = require('mailparser').MailParser;

exports = module.exports = {

    hash: function (pass) {
        return crypto
            .createHash('sha256')
            .update(pass + config.get('salt'))
            .digest('base64');
    },

    encryptInbox: function (inbox) {
        var cipher = crypto.createCipher('aes-256-ctr', config.get('inboxSalt'));
        var crypted = cipher.update(inbox, 'utf8', 'hex');
        crypted += cipher.final('hex');
        // format has 'inbox-' in the beginning
        return 'inbox-' + crypted;
    },
    decryptInbox: function (inbox) {
        // split off 'inbox-'
        var inboxHash = inbox.split('@')[0].slice(6);
        var decipher = crypto.createDecipher('aes-256-ctr', config.get('inboxSalt'));
        var dec = decipher.update(inboxHash, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    },

    ValidateEmail: function (emailAddress) {
        if (!emailAddress) return false;
        var emailAddressArray = emailAddress.split('@');

        if (emailAddressArray.length !== 2) return false;
        if (emailAddressArray[0].length > 125) return false;

        return emailAddress.toLowerCase();
    },

    parseRawMessage: function (rawmsg, callback) {
        var mailparser = new MailParser();

        mailparser.on("end", function (mailObject) {
            callback(null, mailObject);
        });

        mailparser.on("error", callback);

        // send the email source to the parser
        mailparser.write(rawmsg);
        mailparser.end();

    },
    getReadableSize: function (bytes) {
        var KB = 1024;
        var MB = 1024 * KB;
        var GB = 1024 * MB;

        if (bytes < KB) {
            return bytes + ' B';
        }
        if (bytes < MB) {
            return (bytes / KB).toFixed(2) + ' KB';
        }
        if (bytes < GB) {
            return (bytes / MB).toFixed(2) + ' MB';
        }
        return (bytes / GB).toFixed(2) + ' GB';
    },

    randomInt: function (low, high) {
        return Math.floor(Math.random() * (high + 1 - low) + low);
    },

    // extract only unique values from an array, like lodash.uniq
    uniq: function uniq(array) {
        var length = array ? array.length : 0;
        if (!length) {
            return [];
        }
        var found = [];
        var item = null;
        for (var i = 0; i < length; i++) {
            item = array[i];
            if (~found.indexOf(item)) { found.push(item); }
        }
        return found;
    }
};
