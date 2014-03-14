
// Note: Removal Service will not work if you turn the 
// mailsac collection into a capped one.

var settings = {
	
	port: 3000,

	secret: "",
	
	SMTP_DOMAIN: 'mailsac.com',
	
	enable_outbound: false,
	
	normal_smtp_opts: {
		timeout: 30 * 1000, // in ms
		SMTPBanner: 'MAILSAC',
		//disableDNSValidation: true,
		debug: false
	},
	
	normal_smtp_port: process.env.mailport1 || 25,
	
	secure_smtp_opts: {
		timeout: 30 * 1000, // in ms
		SMTPBanner: 'MAILSAC',
		//disableDNSValidation: true,
		debug: false,
		secureConnection: true
	},


	
	secure_smtp_port: process.env.mailport2 || 587,
	
	// cutoff in number of minutes, if removal service is turned on
	cutoff: 60 * 24 * 4, // 4 days
	
	// how often to check for items to be removed in miliseconds, if removal service is turned on
	perform_removal: 1000 * 60 * 60 * 3, // 3 hours
	
	perform_stat_check: 1000 * 60 * 60 * 1, // 1 hour
	
	// minimum stat total for number of messages, to seed your stat
	default_stat_total: 362123,
	
	// max messages per inbox
	max_messages: 20
};


switch(process.env.NODE_ENV || "dev") {
	
	// 
	// Production
	//
	case "prod":
	
		settings.Mongo = {
			db: "", // mailsac
			user: "",
			pass: "",
			path: "" // localhost/mailsac
		};
		
		settings.SMTP_ENABLED = true;
		
		settings.remove_on_boot = false;
		
		settings.removal_service_enabled = false;
		
		settings.mongo_debug = false;
		
	break;
	
	// 
	// dev
	//
	default:
			
		settings.Mongo = {
			db: "",
			user: "",
			pass: "",
			path: "" // exampleds332341334234.mongolab.com:33333
		};
		
		settings.SMTP_ENABLED = false;
		
		settings.remove_on_boot = true;
		
		settings.removal_service_enabled = false;
		
		settings.mongo_debug = false;
}

// export settings.Mongo.url for Mongoose to use to connect
settings.Mongo.url = "mongodb://";
	if(settings.Mongo.user && settings.Mongo.pass)
	{
		settings.Mongo.url += settings.Mongo.user+":"+settings.Mongo.pass+"@";
	}
	settings.Mongo.url += settings.Mongo.path+"/"+settings.Mongo.db;

module.exports = settings;
