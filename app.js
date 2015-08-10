'use strict';

// Print a super long stack trace when not in production.
// This kills performance but is great for debugging.
if (process.env.NODE_ENV !== 'production') {
    require('longjohn');
}


var debug = require('debug')('mailsac');
process.on('uncaughtException', function (err) {
    debug('PROCESS UNCAUGHT EXCEPTION', err.message, err.stack);
    // do restart immediately, to prevent massive system load
    setTimeout(function () {
        process.exit();
    }, 300);
});

// Master process and workers
var config = require('config');
var cluster = require('cluster');
var WORKER_TOTAL = config.get('workers') || 1;
var child;
if (cluster.isMaster) {
    debug('master', process.pid);
    for (var i = 0; i < WORKER_TOTAL; i++) {
        child = cluster.fork();
        debug('forked worker', child.process.pid);
    }
    cluster.on('exit', function (worker, code, signal) {
        debug('worker DIED', + worker.process.pid, code);
        setTimeout(function () {
            cluster.fork();
        }, 300);
    });
    return;
}

// Worker / application
var express = require('express');
var fs = require('fs');
var path = require('path');
var nodemailer = require('nodemailer');
var moment = require('moment');
var fs = require('fs');
var SimpleSmtp = require('simplesmtp');
var jade = require('jade');
var url = require('url');

debug('------ Mailsac Worker Start ------', (process.env.NODE_ENV || 'development'), process.pid, '\n');


// Express middleware
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var middleware = require('./lib/middleware');
var compression = require('compression');


// smtp
var smtp = require('./smtp-server');

var mailTransport = nodemailer.createTransport(config.get('smtp'));
if (process.env.NODE_ENV === 'production') {
    process.on('uncaughtException', function (err) {
        console.log('\n\n----\nPROCESS CAUGHT EXCEPTION', err);
        console.log(err.stack);
        // TODO: node >=0.10.6
        if (err.message === 'read ECONNRESET') {
            process.exit();
        }
        mailTransport.sendMail({
            from: config.get('email.from'),
            to: config.get('email.notify'),
            subject: '[' + config.get('name') + ' event] CRASH',
            text: err + '\n\n' + err.stack + '\n\n',
        }, function (err) {
            if (err) {
                debug(err);
            }
            process.exit();
        });
    });
}
// app utilities
var appUtilities = require('./lib/app-utilities');

var schemas;
var models = {};

var app = express();

var mongoose = require('mongoose');
mongoose.connection.on('error', function (err) {
    debug('mongo', err);
});
mongoose.connection.on('connected', function () {
    debug('mongo', 'connected', mongoose.connection.host);
});
mongoose.connect(config.get('mongoURI'), function (err) {
    if (err) {
        debug('mongo', err);
    }
    schemas = require('./schemas')(mongoose);

    // Serving static assets
    app.use(favicon(__dirname + '/public/favicon.ico'));
    app.use(logger('dev'));
    app.use(compression());
    // Attaching app locals and utils to request
    app.use(function (req, res, next) {
        // Open for api access
        // res.set('Access-Control-Allow-Origin', '*');
        res.locals = req.locals || {};
        res.locals.config = config;
        res.locals.req = req;
        res.locals.moment = moment;

        // format is: `{ path: "/docs", text: "Documentation", icon: 'page' }`
        res.locals.menu = [];
        res.locals.links = [];

        req.db = models;
        req.email = mailTransport;
        // internal notifications to admin for important events
        req.debug = function (one, two, three) {
            if (process.env.NODE_ENV !== 'production') {
                return
            }
            var text = '[' + config.get('name') + '] ' + one + '\n\n';
            if (two) {
                text += '----\n' + JSON.stringify(two, null, 4) + '\n----\n';
            }
            if (three) {
                text += '----\n' + JSON.stringify(three, null, 4) + '\n----\n';
            }
            req.email.sendMail({
                from: config.get('email.from'),
                to: config.get('email.notify'),
                subject: '[' + config.get('name') + ' event] ' + one,
                text: text
            }, function (err) {
                if (err) {
                    debug('internalEvent FAIL', err, one, two, three);
                }
            });
        };

        req.utils = res.locals.utils = appUtilities;

        next();
    });
    app.use(require('less-middleware')(path.join(__dirname, 'public')));
    app.use(express.static(path.join(__dirname, 'public')));



    var sessionStore = new RedisStore();
    app.use(session({
        secret: config.get('sessionSecret'),
        store: sessionStore,
        saveUninitialized: true,
        resave: true,
        cookie: {
            maxAge: config.get('cookieMaxAge')
        }
    }));

    // Request parsers
    app.use(bodyParser.json({
        limit: config.get('maxUploadSize')
    }));
    app.use(bodyParser.urlencoded({
        extended: false,
        limit: config.get('maxUploadSize')
    }));
    app.use(cookieParser());

    // view engine setup
    app.set('view engine', 'jade');
    // You can add custom views inside plugins by pushing more paths
    // into viewFolders.
    var viewFolders = [path.join(__dirname, 'views')];


    //
    // Loading Mailsac plugins
    //


    var pluginPath = path.join(__dirname, 'plugins');
    var pluginVars = {
        schemas: schemas,
        config: config,
        email: mailTransport,
        app: app,
        viewFolders: viewFolders
    };
    var menus = [];
    var links = [];
    var routes = [];
    var hooks = {
        afterCreateMessage: [function (savedMessage, parsedMessage) {

        }]
    };
    var inits = [];
    var includes = {
        head: [],
        footer: []
    };

    function run(fn) {
        fn();
    }
    if (!config.get('disablePlugins') && fs.existsSync(pluginPath)) {
        var bootstrapPlugin = function (file) {
            // plugins must have `.plugin.js`
            if (file.indexOf('.plugin') === -1) return;

            var fullPath = './plugins/' + file;
            debug('loading plugin', fullPath);

            var plugin = require(fullPath)(pluginVars, app);

            if (plugin.init) {
                inits.push(plugin.init);
            }
            if (plugin.menu) {
                menus.push(plugin.menu);
            }
            if (plugin.links) {
                links.push(plugin.links);
            }
            if (plugin.routes) {
                routes.push(plugin.routes);
            }

            if (plugin.hooks) {
                Object.keys(plugin.hooks).forEach(function (h) {
                    hooks[h].push(plugin.hooks[h]);
                });
            }

            var includesPath = path.resolve(__dirname, fullPath, 'includes');
            if (fs.existsSync(includesPath)) {
                fs.readdirSync(includesPath).forEach(function (jadeFile) {
                    includes[jadeFile.replace('.jade', '')].push(path.resolve(includesPath, jadeFile));
                });
            }
        };
        var pluginFiles = fs.readdirSync(pluginPath);
        pluginFiles.forEach(bootstrapPlugin);
    }

    // view extensions
    app.use(function loadIncludes(req, res, next) {
        res.locals.includes = includes;
        res.locals.renderFile = jade.renderFile;
        next();
    });

    inits.forEach(run);

    // After plugins were given the chance to add more view folders,
    // set them here.
    app.set('views', viewFolders);

    menus.forEach(run);
    links.forEach(run);
    routes.forEach(run);

    // Bind application routes
    app.use('/', require('./routes/home'));


    // End plugins


    // After plugins have the chance to alter the schemas,
    // initiate them.
    Object.keys(schemas).forEach(function (name) {
        models[name] = mongoose.model(name, schemas[name]);
    });

    // Error handling routes
    // after plugins in case the plugins extend the app routes
    app.use(middleware.fourOhFour);
    app.use(middleware.errorHandler);


    module.exports = app;

    // Exception handling on the app
    app.on('error', function (err) {
        debug('EXPRESS APP ERROR', err, err.stack);
    });
    app.on('uncaughtException', function (err) {
        debug('EXPRESS APP UNCAUGHT EXCEPTION', err, err.stack);
    });
    var server = app.listen(config.get('port'), function () {
        debug(config.get('name') + ' is listening', config.get('port'));
    });
    server.on('error', function (err) {
        debug('EXPRESS SERVER ERROR', err, err.stack);
    });
    server.on('uncaughtException', function (err) {
        debug('EXPRESS SERVER UNCAUGHT EXCEPTION', err, err.stack);
    });

    if (config.get('forceSSL')) {
        debug('starting ssl server');
        (function () {
            var https = require('https');
            var sslServer = https.createServer({
                key: fs.readFileSync(__dirname + '/keys/mailsac.com.key'),
                cert: fs.readFileSync(__dirname + '/keys/mailsac.com.all.crt')
            }, app);
            sslServer.listen(443, function () {
                debug('ssl server listening', 443);
            });
        })();
    }

    // SMTP server startup
    if (config.get('smtpEnabled')) {
        var normal_smtp_server = new SimpleSmtp.createServer(config.get('normal_smtp_opts'));
        smtp(mongoose, normal_smtp_server, 25, hooks);
        var secure_smtp_server = new SimpleSmtp.createServer(config.get('secure_smtp_opts'))
        smtp(mongoose, secure_smtp_server, 587, hooks);
    }

    // message removal service
    var recursiveRemoval = function () {
        var cutoff = moment().add(-config.get('max_message_age_days'), 'days')._d;
        debug('removal start', cutoff);

        models.Message
            .remove()
            .where('savedBy', null)
            .where('received').lt(cutoff)
            .exec(function (err, count) {
                if (err) {
                    debug('removal error', err);
                    return;
                }
                debug('removed', count.result);
                setTimeout(recursiveRemoval, config.get('removal_interval'));
            });
    };
    if (config.get('removal_interval')) {
        recursiveRemoval();
    }
});
