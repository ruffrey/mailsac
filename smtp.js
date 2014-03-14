var config = require('./config')
  , mongoose = require('mongoose')
  , dateUtils = require('date-utils')
  , colors = require('colors')
  
  , Item = require('./models/item.js')  
  , Stat = require('./models/stat.js')  

  , normal_smtp_server = new require("simplesmtp").createServer(config.normal_smtp_opts)
	normal_port = config.normal_smtp_port
	
  , secure_smtp_server = new require("simplesmtp").createServer(config.secure_smtp_opts)
  , secure_port = config.secure_smtp_port
  , D = function(){return new Date().toFormat('YYYY-MM-DD HH24:MI:SS')};

console.log( D(), 'Starting SMTP server'.bold.blue);

mongoose.set('debug', config.mongo_debug);
mongoose.model('Item', Item.Item);
mongoose.model('Stat', Stat.Stat);
mongoose.connect(config.Mongo.url);

var MailServer;

var MongoConnection = mongoose.connection;

MongoConnection.on('error', function(e) {
	
	console.log( D(), 'Mongo connection error'.red.bold, 
		JSON.stringify(e).red);
	
	setTimeout(function(){
		MongoConnection = mongoose.connect(config.Mongo.url);
	},5000);
	
});

MongoConnection.once('open', function() {
	console.log( D(), 'Mongo'.blue.bold, 'connected'.bold.green );
		
	if(!MailServer)
	{
		MailServer = require('./lib/mailserver');
		
		/* Initialize */
		MailServer(normal_smtp_server, normal_port);
		MailServer(secure_smtp_server, secure_port);
	}
	
	//
	// Getting and registering
	//
	
	Stat.findOne({ name: "TOTAL_RECEIVED_MAIL"}, function(err, body) {
		if(err)
		{
			console.log( D(), 'TOTAL_RECEIVED_MAIL'.red, err);
			return;
		}
		
		if(!body)
		{
			console.log( D(), 'TOTAL_RECEIVED_MAIL does not exist'.yellow);
			new Stat({
				name: 'TOTAL_RECEIVED_MAIL',
				val: config.default_stat_total,
				updated: new Date()
			}).save(function(err, newstat) {
				
				console.log( D(), err || newstat );
				
			});
			
			return;
		}
		// under the default minimum
		else if( parseFloat(body.val) < config.default_stat_total )
		{
			body.val = config.default_stat_total;
			body.updated = new Date();

			body.save(function(err, updStat) {
				
				if(err) 
				{
					console.log(D(), 'error resetting minimum TOTAL_RECEIVED_MAIL');
					return;
				}

				console.log( D(), 'TOTAL_RECEIVED_MAIL'.green, updStat.val, 
					'as of',
					new Date(updStat.updated).toFormat('YYYY-MM-DD HH24:MI:SS') 
				);

			});
		}
		else{
			console.log( D(), 'TOTAL_RECEIVED_MAIL'.green, body.val, 
				'as of',
				new Date(body.updated).toFormat('YYYY-MM-DD HH24:MI:SS') 
			);
		}
			
	});
});


