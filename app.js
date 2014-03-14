

/**
 * Module dependencies.
 */
var express = require('express')
  , http = require('http')
  , path = require('path')
  , dateUtils = require('date-utils')
  , colors = require('colors')
  , engine = require('ejs-locals')
  , expressLayouts = require('express-ejs-layouts')
  , config = require('./config.js')
  
  , middleware = require('./lib/middleware')
  , alternativeOutput = require('./lib/alternativeOutput')
  
  , mongoose = require('mongoose')
  
  , Item = require('./models/item.js')  
  , Stat = require('./models/stat.js')  
  , Survey = require('./models/survey.js')
  
  , route_table = require('./route_table')
  , D = function(){return new Date().toFormat('YYYY-MM-DD HH24:MI:SS')}
  
  , removeOld = require('./lib/removeold')
  , app = express()
  , mailstats = require('./lib/mailstats');


console.log('\n\n', D(), 'Mailsac!\n'.rainbow, process.env.NODE_ENV || 'dev', 'mode');

mongoose.set('debug', config.mongo_debug);
mongoose.model('Item', Item.Item);
mongoose.model('Stat', Stat.Stat);
mongoose.model('Survey', Survey.Survey);

// First and foremost, logger
if(process.env.NODE_ENV!='prod')
{
	app.configure(function(){
		app.use(express.logger('dev'));
	});
}

mongoose.connect(config.Mongo.url);
var MongoConnection = mongoose.connection;

MongoConnection.on('error', function(e) {
	
	console.log( 
		D(), 
		'Mongo'.bold.red.inverse,
		'connection error'.red.bold, 
		JSON.stringify(e).red
	);
	
	// setTimeout(function(){
	// 	MongoConnection = mongoose.connect(config.Mongo.url);
	// },5000);
	
});

// MongoDB, when the connection is open
MongoConnection.once('open', function() {
	console.log( 
		D(), 
		'Mongo'.blue.bold.inverse, 
		'connected'.bold.green 
	);
});

mailstats();

// Configurations
app.configure(function(){
	
	app.set('env',process.env.NODE_ENV || 'dev');
	
	app.use(express.compress({
		level: 9,
		memLevel: 9
	}));
	
	app.use(express.static(path.join(__dirname, 'public'), {maxAge: 86400000}));
	app.use(express.favicon());
	//app.use(express.cookieParser(config.secret));
	
	app.set('config', config);
	
	//app.use(express.bodyParser());
	app.use(express.methodOverride());
	
	
	app.set('port', config.port);
	app.set('views', __dirname + '/views');
  
	app.engine('ejs', engine);
	app.set('view engine', 'ejs');
	
	app.use(function(req, res, next) {
		res.locals.extractScripts = true;
		next();
	});
	
	app.use(expressLayouts);
	
	app.use(alternativeOutput);
	
	// use the URL router middleware
	app.use(app.router);
	
});

app.configure('dev', function(){
	app.use(express.errorHandler());
});
app.configure('prod', function(){
	app.set('view cache', true);
});


// Router is bound here
route_table.bind(app);

// Starting up the app
http.createServer(app).listen(app.get('port'), function(){
	console.log(
		D(), 
		"Mailsac".bold.blue.inverse,
		'is alive on port'.green, 
		app.get('port')
	);
});



// 
// Removing old messages service
// 

function RemovalService() {
	
	setTimeout(function() {
		
		removeOld();
		
		RemovalService();
		
	}, config.perform_removal );
}


// Stop here if service is not enabled
if(!config.removal_service_enabled)
{
	console.log(D(), 'removeOld'.bold.inverse, 'service is DISABLED'.yellow);
	return;
}

// Run immediately if enabled on boot
if(config.remove_on_boot)
{
	console.log(D(), 'removeOld'.blue.bold.inverse, 'enabled'.bold.green, 'on boot');
	removeOld();
}
else{
	console.log(
		D(), 
		'removeOld'.blue.bold.inverse, 
		'disabled'.bold.yellow,
		'on boot, next at',
		new Date().addMinutes(config.perform_removal)
			.toFormat('YYYY-MM-DD HH24:MI:SS').yellow
	);
}

RemovalService();

