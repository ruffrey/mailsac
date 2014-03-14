var path = require('path');

module.exports = function(req, res, next) {
	var c_typ = req.get('Accepts') || "",
		_req_file_ext = path.extname(req.url.toLowerCase()),
		renderAsJson = false;
	
	if( _req_file_ext == '.json' )
	{
		req.url = req.url.replace('.json', '');
		renderAsJson = true;
	}
	else if(c_typ.toLowerCase().indexOf('json')>-1)
	{
		renderAsJson = true;
	}
	
	if(renderAsJson)
	{
		res.set('Content-Type', 'application/json');
		res.render = function(a, b) {
			res.send(JSON.stringify(b));
		};
	}
	
	next();
};
