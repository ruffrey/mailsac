
/**
 * All routes are bound on this page using bind()
 */

var controllers = require('./controllers/controller_index.js')
  , middleware = require('./lib/middleware.js')
  , config = require('./config.js');


exports.bind = function(app, passport) {
	
	app.all('*', middleware);
	
	
	app.get('/', controllers.item.homepage);
	app.get('/index', controllers.item.homepage);	
	
	app.get('/inbox/:id', controllers.item.getInbox);
	
	app.get('/dirty/:id', controllers.item.getItemDirty);
	
	app.get('/raw/:id', controllers.item.getItemRaw);
	
	//
	// API
	//
	app.get('/api', function(req, res) {
		res.send({
			success: true,
			api_version: 0.1
		});
	});
	
	if(config.enable_outbound)
	{
		app.post('/api/item/send', controllers.item.api.send);
	}
	app.post('/api/item/:id/delete', controllers.item.api.kill);
	
	app.get('/about', controllers.about);
	app.get('/terms', controllers.terms);
	app.get('/domainsetup', controllers.domainsetup);
	app.get('/stats', controllers.stat.stat_index);
	app.get('/see-the-survey', controllers.survey.survey_data);
	app.get('/survey/submit/:inbox/:val', controllers.survey.submit);
	
	app.all('*', controllers['404']);
	
};
