var Stat = require('mongoose').model('Stat');


exports.stat_index = function(req, res) {
	Stat.find({},null, {sort: { name: -1 } }, function(err, body){
		res.render('stat/stat_index', {
			title: err ? 'stats error' : 'stats',
			stats: body || [],
			errors: err ? [err] : null
		});
	
	});
};
