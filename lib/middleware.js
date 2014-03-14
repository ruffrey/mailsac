var config = require('../config.js'),
	crypto = require('crypto');

module.exports = [
	
	// Local variables
	function(req, res, next) {
		res.locals.config = config;
		res.locals.app_messages = [];
		
		if(req.user)
		{
			res.locals.user = req.user;
		}
		else{
			res.locals.user = null;
		}
		
		res.locals.query = req.query;
		
		res.locals.session = req.session;
		
		res.locals.sanitize = require('sanitizer').sanitize; // html sanitizer
		
		res.locals.inbox = ""; // is the user looking at an inbox?
		
		next();
	}
];
