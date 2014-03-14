var dns = require('dns'),
	nodemailer = require('nodemailer'),
	config = require('../config.js');

module.exports = exports = function(){
	
	function getDomainFromAddress(addr){
		var splr;
		if(!addr)
		{
			return null;
		}
		splr = addr.split('@');
		if(splr.length == 1)
		{
			return addr;
		}
		
		return splr[1].replace(/\>/g,'');
	}
	
	this.send = function (msgObj, SendCallback) {
	
		TransportMessage(msgObj, function(err) {
			if(SendCallback instanceof Function)
			{
				SendCallback(err);
			}
		});
		
	};
	
	
	function getMx(domain, cb) {
		
		dns.resolveMx(domain, cb);
		
	}
	
	// returns Error
	function TransportMessage(messageObject, callback) {
		//console.log('Transport'.bold.blue, messageObject);
		
		if(messageObject.to.indexOf('<')==-1)
		{
			messageObject.to ='<'+messageObject.to+'>';
		}
		
		var domain = getDomainFromAddress(messageObject.to);
		
		getMx(domain, function(err, adr){
			if(err)
			{
				console.log('MX: lookup failed'.red, err.toString());
				return callback(new Error('MX: lookup failed - ' + err.toString()));
			}
			
			if( !adr.length || !adr[0].exchange )
			{
				console.log('MX: no records'.yellow, domain, adr);
				return callback(new Error('MX: no MX records for domain ' + domain));
			}
				
			//console.log('transporting to'.bold, adr[0].exchange, adr[0]);
			
			var transport = nodemailer.createTransport("SMTP", {
				
				host: adr[0].exchange,
				port: messageObject.port || 25,
				//validateRecipients: true,
				//debug: true,
				maxConnections: 1
		
			});
			
			transport.sendMail(messageObject, sendMailCallback);
			
			function sendMailCallback(err, smtp_res) {
				
				if(err)
				{
					console.log('sendMail'.red.bold, err);
				}
					
				transport.close(function(er){
					if(er)
					{
						console.log(
							'transport.close()'.red.bold, 
							er
						);
					}
					
					transport = null;
					
					callback(err);
					
				});
			}
		});
		
	};
};
