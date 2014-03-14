var fs = require('fs'),
	md = require("node-markdown").Markdown;

// Terms and Acceptable Use Policy
exports.terms = function(req, res) {
	fs.readFile(__dirname+'/../views/content/terms.md', 'utf8', function(err, fileText) {
		
		if(fileText)
		{
			fileText = md(fileText);
		}
		
		res.render('content/md.ejs', {
			title: 'Terms and Privacy',
			md: fileText,
			errors: err ? [err] : []
		});
	});
};
// About
exports.about = function(req, res) {
	fs.readFile(__dirname+'/../README.md', 'utf8', function(err, fileText) {
		
		if(fileText)
		{
			fileText = md(fileText);
		}
		
		res.render('content/md.ejs', {
			title: 'Mailsac FAQ',
			md: fileText,
			errors: err ? [err] : []
		});
	});
};

exports.domainsetup = function(req, res) {
	res.render('content/domainsetup.ejs', {
		title: 'Use Mailsac for your domain'
	});
};

exports['404'] = function(req, res) {
	res.render('404', {
		title: 'Not found',
		path: req.path,
		method: req.method,
		message: 'Resource not found'
	});
};


exports.item = require('./controller_item.js');
exports.stat = require('./controller_stat.js');
exports.survey = require('./controller_survey.js');
