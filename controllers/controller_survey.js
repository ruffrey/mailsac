var Survey = require('mongoose').model('Survey'),
	sanitize = require('sanitizer').sanitize;


exports.survey_data = function(req, res) {
	Survey.find({},null, {sort: { date: -1 } }, function(err, body){
		
		res.render('survey/survey_data', {
			layout: false,
			data: body,
			errors: err ? [err] : null
		});
	
	});
};

exports.submit = function(req, res) {
	new Survey({
		val: req.params.val,
		inbox: req.params.inbox,
		date: new Date()
	}).save(function(err, surv){
		
		res.send({
			success: !err,
			message: err || "Thanks!"
		});
		
	});
};
