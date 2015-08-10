'use strict';
var express = require('express');
var router = express.Router();
var config = require('config');
var debug = require('debug')('mailsac-home-routes');

/**
 * Homepage
 */
router.get('/', function routeGetIndexHomepage(req, res) {
    res.render('index', { title: config.get('name') });
});

router.get('/inbox/:email', function routeGetInboxEmail(req, res, next) {
    res.render('inbox-base', {
        title: req.params.email,
        email: req.params.email
    });
});
router.get(['/dirty/:messageId/', '/raw/:messageId'], function routeGetDirtyOrRawMsg(req, res, next) {
    req.db.Message
        .findById(req.params.messageId)
        .exec(function (err, msg) {
            if (err) {
                return next(err);
            }
            if (!msg) {
                err = new Error('That message has expired or does not exist.');
                err.status = 404;
                return next(err);
            }
            var rawOrDirty = req.url.split('/')[1];
            res.render(rawOrDirty, {
                title: msg.subject || 'Message',
                message: msg
            });
        });
});

router.delete('/api/addresses/:email/messages/:id', function (req, res, next) {
    req.db.Message
        .remove({ _id: req.params.id })
        .exec(function (err, data) {
            if (err) {
                return next(err);
            }
            if (!data.result.n) {
                err = new Error('Message was not found.');
                err.status = 404;
                return next(err);
            }
            res.send({ message: 'Message was deleted.'});
        });
});

router.get('/api/addresses/:email/messages', function (req, res, next) {
    req.db.Message
    .find()
    .where('inbox', req.params.email)
    .select('inbox savedBy body text _id from subject received originalInbox')
    .exec(function (err, messages) {
        if (err) {
            err.status = 500;
            return next(err);
        }
        res.send(messages);
    });
});

module.exports = router;
