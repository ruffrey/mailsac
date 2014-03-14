var mongoose = require('mongoose'),
	
	surveySchema = new mongoose.Schema({
		
		inbox: String,
		val: String,
		date: Date
		
	});
 
module.exports = mongoose.model('Survey', surveySchema);
