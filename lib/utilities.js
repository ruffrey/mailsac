var crypto = require('crypto'),

	config = require('../config'),
	
	MailParser	= require('mailparser').MailParser;

module.exports = {
	
	HASH: function(passwd) {
		return crypto
			.createHmac('sha256', config.secret.toString('base64') )
			.update(passwd)
			.digest('base64');
	},
	
	ValidateEmail: function(_eml_addr) {
		var arrEmlAddr = _eml_addr.split('@');
		
		if(arrEmlAddr.length!=2)
		{
			return false;
		}
		
		/*if(arrEmlAddr[1].toLowerCase() != config.SMTP_DOMAIN)
		{
			return false;
		}*/
		
		if(arrEmlAddr[0].length > 25)
		{
			return false;
		}
		
		return _eml_addr.toLowerCase();
	},
	
	parseRawMessage: function(rawmsg, callback){
		var mailparser = new MailParser();

		
		mailparser.on("end", function(mail_object){
			callback(false, mail_object);
		});

		// send the email source to the parser
		mailparser.write(rawmsg);
		mailparser.end();
		
	}
	
};
