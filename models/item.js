var mongoose = require('mongoose'),
	
	ObjectId = mongoose.Schema.ObjectId,
 
	itemSchema = new mongoose.Schema({
		
		// from Mailparser
		headers: Object,
		from: Array,
		to: Array,
		cc: Array,
		bcc: Array,
		subject: String,
		references: Array,
		inReplyTo: Array,
		priority: String,
		text: String,
		html: String,
		//attachments: Array,
		
		// other fields
		inbox: String,
		domain: String,
		raw: String,
		received: Date,
		body: String // sanitized html
		
	});
 
module.exports = mongoose.model('Item', itemSchema);
