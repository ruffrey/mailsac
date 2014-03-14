var config = require('../config'),
	
	colors = require('colors'),
	
	utilities = require('./utilities.js'),
	
	mongoose = require('mongoose'),
	
	Item = mongoose.model('Item'),
	
	Stat = mongoose.model('Stat'),
	
	sanitize = require('sanitizer').sanitize,
	
	Log = console.log,
	
	D = function(){return new Date().toFormat('YYYY-MM-DD HH24:MI:SS')},
	
	PENDING_RECEIVED_STAT = 7; // because likely some were pending when rebooting


function UpdateTotalReceivedMail(add_this_many) {
	
	Stat.findOne({
		name: 'TOTAL_RECEIVED_MAIL'
	}, function(err, stat) {
		if(err)
		{
			Log(D(), err);
			return;
		}
		

		var update_fields = {
			val: parseFloat(stat.val) + add_this_many,
			updated: new Date()
		};
		
		
		Stat.findByIdAndUpdate( stat._id, update_fields, function(err, body) {
			if(err)
			{
				// put them back onto the pending stat if failed
				PENDING_RECEIVED_STAT += add_this_many;
				
				Log(D(), 'Problem updating TOTAL_RECEIVED_MAIL'.red, stat.val);
				return;
			}
			
			Log(D(), 'TOTAL_RECEIVED_MAIL set to'.green, update_fields.val);
		});
	});
	
}

function CheckIfNeedStatUpdate() {
	if(PENDING_RECEIVED_STAT > 12)
	{
		UpdateTotalReceivedMail( PENDING_RECEIVED_STAT + 0 ); // create a copy
		PENDING_RECEIVED_STAT = 0;
	}
	
}

module.exports = function(smtp, run_port){


	smtp.on("validateRecipient", function(connection, email, callback){
		PENDING_RECEIVED_STAT++;
		
		//Log(D(), 'VALIDATING'.yellow.bold.inverse, email);
		
		var emailValidated = utilities.ValidateEmail(email);
		
		if( !emailValidated )
		{
			Log(D(), 'Invalid email addr'.bold.red.inverse, email);
			
			return callback( new Error("Invalid email addr") );
		}
		
		//Log(D(), 'VALIDATED'.blue.bold.inverse, email);
		
		connection.full_email = email;
		connection.inbox = emailValidated;
		
		callback(false);
	});

	smtp.on("startData", function(connection){
		
		connection.messageText = '';
		
	});
	
	// TODO: implement max size
	smtp.on("data", function(connection, chunk){

		connection.messageText += chunk;
		
	});

	smtp.on("error", function(connection){
		
		Log(D(), "FAIL".bold.red, connection.from, 'to:'.bold, connection.to);
		
	});


	/* client is finished passing e-mail data, 
	   callback returns the queue id to the client 
	 */
	smtp.on("dataReady", function(connection, dataReadyCallback){
		
		//Log(D(), "ACCEPTED".bold.blue, connection.from, 'to:'.bold, connection.inbox);
		
		utilities.parseRawMessage(connection.messageText, function(err, parsedMessage){
		
			if(err)
			{
				Log(D(),'PARSE FAIL'.bold.red, err);
				
				return callback( new Error("Unable to parse raw mail") );
			}
			
			parsedMessage.raw = connection.messageText;
			parsedMessage.received = D();
			parsedMessage.body = sanitize( parsedMessage.html || parsedMessage.text || "" );
			parsedMessage.inbox = connection.inbox;
			parsedMessage.domain = connection.inbox.split('@')[1];
			
			
			new Item(parsedMessage).save(
				function (err, item) {
	
					if(err)
					{
						Log(D(), 'CREATE ITEM FAIL'.bold.red, err);
						
						return dataReadyCallback(new Error("Invalid email format"));
					}
					
					//Log(D(), 'CREATE ITEM SUCCESS'.bold.green);
					
					dataReadyCallback(null, "O"); // O is the queue id to be advertised to the client
					
					// now remove any emails over the limit
					
					Item.find()
					.where('inbox',parsedMessage.inbox)
					.sort({'received':-1})
					.exec(function(err, allMsgs){
						if(err)
						{
							Log(D(), 'FAIL checking inbox size'.bold.red, err);
							return;
							
						}
						
						if(allMsgs && allMsgs.length && allMsgs.length > config.max_messages)
						{
							
							var maxItemDateBeforeDelete = allMsgs[config.max_messages - 1].received;
							
							Item.update({
								inbox: parsedMessage.inbox,
								received: { $lt: maxItemDateBeforeDelete }
							}, {
								body: null,
								inbox: null,
								raw: null,
								domain: null,
								received: null
							}, function(err, updResp) {
								if(err)
								{
									Log(D(), 'PROBLEM removing emails over inbox quota', err);
									return;
								}
							});
						}
					});
				}
			);
			
		});
		
		CheckIfNeedStatUpdate();
	});
	
	
	/*smtp.on('close', function(connection){
		
		console.log(
			"---\nConnection closed:".bold.blue, 
			connection.from, 
			'to:'.bold, connection.to,
			"---\n"
		);
		
	});*/

	smtp.listen(run_port, function(err){
		err && console.log(D(), 'Error starting SMTP'.bold.red, run_port, err);
		
		!err && console.log(D(), 'SMTP server listening'.blue.bold.inverse, 'port'.bold, run_port);
	});
	
};


