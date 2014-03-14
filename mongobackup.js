

// @param {object} cfg - {
// 		backup: {
// 			host: "ds03234.mongolab.com",
// 			port: 32352,
// 			username: "sadkfsd",
// 			password: "dnn32sdfc2343"
// 		},
//	 	primary: {
// 			uri: "mongo://someone:pass@localhost:32423",
// 			dbname: "mailsac"
// 		}
// 	}

function MongoBackup(cfg, callback) {

	if(!cfg) return callback( new Error("MongoBackup is missing configuration!"), self );
	if(!cfg.backup) return callback( new Error("MongoBackup is missing backup db info!"), self );
	if(!cfg.primary) return callback( new Error("MongoBackup is missing primary db info!"), self );


	var self = this,
		mongoose = require('mongoose');

	self.primaryConnection = null;

	self.config = {
		backup: cfg.backup,
		primary: cfg.primary
	};

	
	// @returns {function(err, mongoBackupInstance)} - cb
	self.backup = function(cb) {

		var conn = mongoose.connect( self.config.primary.uri );
		conn.set('debug', true);

		self.primaryConnection = conn.connection;

		self.primaryConnection.once('open', function() {
			console.log( 'MongoBackup connected to primary db.' );


			var copyCommand = 'db.copyDatabase('
				+self.config.primary.dbname+',' // from db
				+self.config.primary.dbname+',' // to db
				+self.config.backup.host + ":" + (self.config.backup.port || 27017);

			if(self.config.backup.username && self.config.backup.password) 
			{
				copyCommand += ','+self.config.backup.username+','+self.config.backup.password;
			}

			copyCommand += ');';

			console.log('running copy command', copyCommand);

			self.primaryConnection.db.commands.push(copyCommand);

		});
		self.primaryConnection.on('error', function(err) {
			cb( new Error('MongoBackup ERROR. ' + err) );
		});


	};

	return self;

}

MongoBackup({
	backup: {
		host: "localhost/mailsac2",
		username: "",
		password: ""
	},
 	primary: {
		uri: "mongodb://localhost:27017",
		dbname: "mailsac"
	}
}).backup(function(err) {
	console.log(err);
});;

exports = module.exports = MongoBackup;