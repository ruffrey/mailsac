'use strict';
var async = require('async');

exports.isAuthorized = function (req, res, next) {
    if (!req.user || !req.user._id) {
        var err = new Error("Not authorized. You may need to log in first.");
        err.status = 401;
        next(err);
        return;
    }
    next();
};

exports.hasSub = function (req, res, next) {
    if (!req.user || (!req.user.sub && !req.user.isAdmin)) {
        var err = new Error("A paid subscription is required to access that page.");
        err.status = 401;
        next(err);
        return;
    }
    next();
};

exports.isAllowedToSend = function (req, res, next) {
    if (!req.user || !req.user._id) {
        return res.redirect('/auth/login?error=' + encodeURIComponent(
            'Please sign in or create an account so you can send messages.'
        ) + '&continue=' + encodeURIComponent(req.url));
    }
    if (req.user.sendsRemaining < 1) {
        return res.redirect('/dashboard?message=' + encodeURIComponent(
            'You must purchase more outgoing messages before you can send.'
        ));
    }
    next();
};

exports.canAlterAddressMessages = function (req, res, next) {
    var email = req.params.email || req.body.email || req.params.inbox || req.body.inbox || req.body.from;
    if (!email) {
        var err = new Error("Missing email parameter.");
        err.status = 404;
        next(err);
        return;
    }
    req.db.Address.findOne().where('_id', email).exec(function (err, address) {
        if (err) return next(err);

        // is not owned, so the answer is yes
        if (!address) return next();

        if (!req.user || !req.user._id) {
            var err = new Error('Please log in first.');
            err.status = 401;
            return next(err);
        }
        if (!req.user.isAdmin && req.user._id.toString() !== address.owner.toString()) {
            var err = new Error(email + ' is owned by another account.');
            err.status = 403;
            return next(err);
        }
        next();
    });
};

exports.fourOhFour = function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
};

// will respond with JSON or HTML depending upon request
exports.errorHandler = function (err, req, res, next) {
    err.status = err.status || 500;

    var errOut = {
        error: err,
        message: err.message,
        status: err.status
    };
    var prefersJson = req.accepts(['html', 'json']);

    if (err.status === 500) req.debug('Server Error', err, err.stack);


    if (process.env.NODE_ENV === 'production') {
        delete errOut.error.stack;
    }

    res.status(err.status);


    if (prefersJson === 'json') {
        res.send(errOut);
        return;
    }
    else if (err.status === 401) {
        res.redirect('/auth/login?continue=' + encodeURIComponent(req.url));
    }
    else {
        errOut.title = errOut.message;
        res.render('error', errOut);
    }

};
