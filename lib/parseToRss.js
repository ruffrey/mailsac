var htmlEscape = require('./htmlEscape');

module.exports = function(array_of_items, full_email_address) {
	var __n = new Date(),
	
		rss = '<?xml version="1.0" encoding="UTF-8" ?>'
			+ '<rss version="2.0">'
			+ '<channel>'
			+	'<title>'+ full_email_address +'</title>'
			+	'<description>Mailsac.com inbox for '+full_email_address+'</description>'
			+	'<link>http://mailsac.com/inbox/'+ full_email_address +'</link>'
			+	'<lastBuildDate>'+ __n +'</lastBuildDate>'
			+	'<pubDate>'+ __n +'</pubDate>'
			+	'<ttl>30</ttl>';
	
	if(array_of_items && array_of_items.length)
	{
		for(var r=0; r<array_of_items.length; r++)
		{
			rss += '<item>'
					+ '<title>'+ htmlEscape(array_of_items[r].subject) +'</title>'
					+ '<description>'+ htmlEscape(array_of_items[r].body) +'</description>'
					+ '<link>http://mailsac.com/dirty/'+ array_of_items[r]._id +'</link>'
					+ '<guid>'+ array_of_items[r]._id + '</guid>'
					+ '<pubDate>'+ array_of_items[r].received +'</pubDate>'
				+ '</item>';
		}
	}
	
	rss +=	  '</channel>'
			+ '</rss>';
	
	return rss;
};
