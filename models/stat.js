var mongoose = require('mongoose'),
	
	statSchema = new mongoose.Schema({
		
		name: String,
		val: Object,
		updated: Date
		
	});
 
module.exports = mongoose.model('Stat', statSchema);
