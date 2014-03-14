var Item = require('mongoose').model('Item'),
	ObjectId = require('mongoose').Schema.ObjectId
	sanitize = require('sanitizer').sanitize,
	path = require('path'),
	parseToRss = require('../lib/parseToRss'),
	mailout = require('../lib/mailout');

exports.getItemRaw = function(req, res) {
		
	Item.findById(req.params.id, function(err, item) {
		
		res.setHeader('Content-type','text/html');
		
		if(err || !item)
		{
			console.log(new Date().toFormat('YYYY-MM-DD HH24:MI:SS'), 
				'getItemRaw'.bold.red, err || 'controller_item: item is null'.red, req.params.id);
			
			
			return res.render('item/raw', {
				layout: false,
				errors: ['Sorry, an error occurred while loading your email. It may have been deleted.',
					err ? err.toString() : ""]
			});
		}
		
		res.locals.inbox = item.inbox;
		
		res.render('item/raw', {
			layout: false,
			item: item.raw
		});
	});
	
};
exports.getItemDirty = function(req, res) {
	
	Item.findById(req.params.id, function(err, item) {
		
		if(err) 
		{
			console.log(new Date().toFormat('YYYY-MM-DD HH24:MI:SS'), 
				'getItemDirty'.bold.red, err, req.params.id);
			
			return res.render('item/dirty',{
				layout: false,
				errors: ['Sorry, an error occurred while loading your email. It may have been deleted.',
					err ? err.toString() : ""]
			});
		}

		if(!item)
		{
			console.log(new Date().toFormat('YYYY-MM-DD HH24:MI:SS'), 
				'getItemDirty'.bold.red, 'controller_item: item is null'.red, req.params.id);
			
			return res.render('item/dirty',{
				layout: false,
				errors: ['Sorry, an error occurred while loading your email. It may have been deleted.',
					err ? err.toString() : ""]
			});
		}
		
		res.locals.inbox = item.inbox;
		
		res.render('item/dirty', {
			layout: false,
			item: item.html || item.text || item.body
		});
	});
	
};


exports.getInbox = function(req, res) {
	var query = Item.find(),
		file_ext = path.extname(req.url.toLowerCase());
	
	if(file_ext=='.rss')
	{
		req.url = req.url.replace('.rss','');
		req.params.id = req.params.id.replace('.rss','');
	}
	
	var inbox = req.params.id.toLowerCase();
	res.locals.inbox = inbox;
	
	// maintaining compatibility, can delete in a few days from May 19, 2013
	if( inbox.indexOf('@mailsac.com')!=-1)
	{
		query.or([
			{ 'inbox': inbox.split('@')[0] },
			{ 'inbox': inbox }
		]);
	}
	// if only sending inbox name, map it to mailsac.com
	else if( inbox.indexOf('@')==-1)
	{
		query.or([
			{ 'inbox': inbox+'@mailsac.com' },
			{ 'inbox': inbox } // compat; delete a few days after May 19, 2013
		]);
	}
	else{
		query.where('inbox', inbox );
	}
	
	query
	.sort({received:-1})
	.exec(
		function(err, messages) {
			
			// for an RSS feed
			if(file_ext=='.rss')
			{
				res.set('Content-Type', 'text/xml');
				
				return res.send(
					parseToRss(messages, inbox)
				);
			}
			
			var numberOfMessages = typeof(messages.length) != 'undefined' 
				? messages.length
				: 0;
			
			res.render('item/inbox.ejs', {
				title: '('+ numberOfMessages + ') '+req.params.id + ' - inbox',
				inbox: req.params.id,
				messages: messages,
				errors: err
			});
		}
	);
};

exports.homepage = function(req, res) {
	res.render('index.ejs', {
		title: 'modern mobile disposable email'
	});
};

exports.api = {
	
	send: function(req, res) {
		var message = {
			to: req.body.to,
			cc: req.body.cc,
			bcc: req.body.bcc,
			
			from: req.body.from,
			replyTo: req.body.from,
			
			inReplyTo: req.body.inReplyTo,
			
			subject: req.body.subject,
			body: req.body.body,
			
			generateTextFromHTML: true,
			
		};
		
		if(!req.body.wait)
		{
			mailout.send(message, function(err) { } );
			
			return res.send({
				success: true,
				message: "Message scheduled for delivery."
			});
		}
		
		mailout.send(message, function(err) {
			
			err && console.log(err);
			res.send({
				success: !err,
				message: err || "Message sent successfully."
			});
		});
		
	},
	
	kill: function(req, res) {
		
		Item.findById(req.params.id, function(err, item) {
			if(err)
			return res.send({ success: false, message: "err:"+err.toString() });
			
			if(!item) 
			return res.send({success: false, message: 'Unable to retrieve.'});
			
			Item.findByIdAndUpdate(req.params.id, 
			{
				inbox: null,
				raw: null,
				body: null,
				text: null,
				html: null,
				//to: [],
				//from: [],
				//cc: [],
				//bcc: null,
				//subject: null,
				//references: null,
				//inReplyTo: [],
				headers: null
			},
			function(err) {
				res.send({
					success: !err,
					message: err ? "Failed: " +err.toString() : "Deleted successfully."
				});
			});
			
		});	
	}
};


