var config = require('../config.js'),
	Item = require('mongoose').model('Item');

function D(){
	return new Date().toFormat('YYYY-MM-DD HH24:MI:SS');
}

module.exports = function() {
	var cutoff = new Date().addMinutes(-config.cutoff);
	
	console.log(
		D(), 
		'removeOld'.bold.inverse, 
		'checking for mails older than',
		config.cutoff.toString().bold,
		'mins, or',
		config.cutoff/60,
		'hours',
		'(',
			cutoff.toFormat('YYYY-MM-DD HH24:MI:SS').bold,
		')'
	);
	
	Item.find({
		received: {
			$lt: cutoff
		}
	}
	).remove(
		function(err, removedItems) {
			console.log(
				D(),
				err ? 'removeOld'.red.bold.inverse : 'removeOld'.blue.bold.inverse,
				err ? err : removedItems + ' removed'
			);
		}
	);
};
