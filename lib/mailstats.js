// in progress

var config = require('../config'),
	
	mongoose = require('mongoose'),
	
	D = function() { return new Date().toFormat('YYYY-MM-DD HH24:MI:SS'); },
	
	Item = mongoose.model('Item'),
	
	Stat = mongoose.model('Stat');

function mailstats() {
	
	console.log(D(), 'mailstats'.bold.inverse);
	
	
	// CURRENT_MESSAGES
	Item.count({}, function(err, count) {
			
		if(err)
		{
			console.log(D(), 'CURRENT_MESSAGES'.bold.red, err);
			return;
		}
		
		Stat.findOne({name: "CURRENT_MESSAGES"}, function(err, st) {
			if(err)
			{
				console.log(D(), 'CURRENT_MESSAGES'.bold.red, err);
				return;
			}
			
			if(st == null)
			{
				new Stat({
					
					name: "CURRENT_MESSAGES",
					val: count,
					updated: new Date()
					
				}).save(function(err, body) {
					if(err)
					{
						console.log(D(), 'fail create CURRENT_MESSAGES'.bold.red, err);
						return;
					}
					console.log(D(), 'created CURRENT_MESSAGES'.bold.blue, count);
				});
			}
			else{
				Stat.update(
					{name: "CURRENT_MESSAGES"}, 
					{val: count, updated: new Date() }, 
					function(err, body) {
						if(err)
						{
							console.log(D(), 'fail update CURRENT_MESSAGES'.bold.red, err);
							return;
						}
						console.log(D(), 'updated CURRENT_MESSAGES'.bold.blue, count);
					}
				);
			}
			
			
		});
	});
	
	
	// UNIQUE_INBOXES

	Item.aggregate(
		{ $group: { _id: { inbox: "$inbox" } } },
		{ $group: { _id: null, count: { $sum: 1 } } },
		function(err, result) {
			var stat_name = 'UNIQUE_INBOXES';
			
			if(err)
			{
				console.log(D(), stat_name.bold.red, err);
				return;
			}
			
			var count = result && result.length > 0 ? result[0].count : 0;
			
			Stat.findOne({name: stat_name}, function(err, st) {
				if(err)
				{
					console.log(D(), stat_name.bold.red, err);
					return;
				}
				
				if(st == null)
				{
					new Stat({
						
						name: stat_name,
						val: count,
						updated: new Date()
						
					}).save(function(err, body) {
						if(err)
						{
							console.log(D(), 'fail create'.bold.red, stat_name, err);
							return;
						}
						console.log(D(), 'created'.bold.blue,stat_name, count);
					});
				}
				else{
					Stat.update(
						{name: stat_name}, 
						{val: count, updated: new Date() }, 
						function(err, body) {
							if(err)
							{
								console.log(D(), 'fail update'.bold.red, stat_name, err);
								return;
							}
							console.log(D(), 'updated'.bold.blue, stat_name, count);
						}
					);
				}
				
			});
		}
	);
	
	// Other domains
	Item
	.distinct('domain', { domain: { $ne: 'mailsac.com' } }, function(err, result) {

		var stat_name = 'ALT_DOMAINS';

		if(err)
		{
			console.log(D(), stat_name.bold.red, err);
			return;
		}
		
		
		Stat.findOne({name: stat_name}, function(err, st) {
			if(err)
			{
				console.log(D(), stat_name.bold.red, err);
				return;
			}
			
			if(st == null)
			{
				new Stat({
					
					name: stat_name,
					val: result.join(', '),
					updated: new Date()
					
				}).save(function(err, body) {
					if(err)
					{
						console.log(D(), 'fail create'.bold.red, stat_name, err);
						return;
					}
					console.log(D(), 'created'.bold.blue,stat_name, result.length);
				});
			}
			else{
				Stat.update(
					{name: stat_name}, 
					{val: result.join(', '), updated: new Date() }, 
					function(err, body) {
						if(err)
						{
							console.log(D(), 'fail update'.bold.red, stat_name, err);
							return;
						}
						console.log(D(), 'updated'.bold.blue, stat_name, result.length);
					}
				);
			}
			
		});
	});
	
	// MESSAGES_RECEIVED_X_HOUR
	for(var i=1; i<73; i++)
	{
		perHourStat(i+0);
	}
	console.log(D(), 'kicked off MESSAGES_RECEIVED_X_HOUR');
	
	var CURRENT_MAILSAC_DOMAIN_MESSAGES = Item.count();
	
	CURRENT_MAILSAC_DOMAIN_MESSAGES
		.where('domain','mailsac.com')
		.exec(function(err, count) {
			if(err)
			{
				console.log(D(), 'CURRENT_MAILSAC_DOMAIN_MESSAGES'.bold.red, err);
				return;
			}
			
			Stat.findOne({name: "CURRENT_MAILSAC_DOMAIN_MESSAGES"}, function(err, st) {
				if(err)
				{
					console.log(D(), 'CURRENT_MAILSAC_DOMAIN_MESSAGES'.bold.red, err);
					return;
				}
				
				if(st == null)
				{
					new Stat({
						
						name: "CURRENT_MAILSAC_DOMAIN_MESSAGES",
						val: count,
						updated: new Date()
						
					}).save(function(err, body) {
						if(err)
						{
							console.log(D(), 'fail create CURRENT_MAILSAC_DOMAIN_MESSAGES'.bold.red, err);
							return;
						}
						console.log(D(), 'created CURRENT_MAILSAC_DOMAIN_MESSAGES'.bold.blue, count);
					});
				}
				else{
					Stat.update(
						{name: "CURRENT_MAILSAC_DOMAIN_MESSAGES"}, 
						{val: count, updated: new Date() }, 
						function(err, body) {
							if(err)
							{
								console.log(D(), 'fail update CURRENT_MAILSAC_DOMAIN_MESSAGES'.bold.red, err);
								return;
							}
							console.log(D(), 'updated CURRENT_MAILSAC_DOMAIN_MESSAGES'.bold.blue, count);
						}
					);
				}
				
				
			});
		});
	
	
	setTimeout(function() {
		
		mailstats();
		
	}, config.perform_stat_check);
	
};

module.exports = mailstats;


function perHourStat(h) {
	if(h < 10)
	{
		h = "0"+h;
	}
	else{
		h = h.toString();
	}
	
	Item.count({
		received: {
			$gte: new Date().addHours(-h),
			$lt: new Date().addHours(-h+1)
		}
	}, function(err, count) {
		
		if(err)
		{
			console.log(D(), ('MESSAGES_RECEIVED_'+h+'_HOUR').bold.red, err);
			return;
		}
		
		Stat.findOne({name: "MESSAGES_RECEIVED_"+h+"_HOUR"}, function(err, st) {
			if(err)
			{
				console.log(D(), ('MESSAGES_RECEIVED_'+h+'_HOUR').bold.red, err);
				return;
			}
			
			if(st == null)
			{
				new Stat({
					
					name: "MESSAGES_RECEIVED_"+h+"_HOUR",
					val: count,
					updated: new Date()
					
				}).save(function(err, body) {
					if(err)
					{
						console.log(D(), ('fail create MESSAGES_RECEIVED_'+h+'_HOUR').bold.red, err);
						return;
					}
					//console.log(D(), ('created MESSAGES_RECEIVED_'+h+'_HOUR').bold.blue, count);
				});
			}
			else{
				Stat.update(
					{name: "MESSAGES_RECEIVED_"+h+"_HOUR"}, 
					{val: count, updated: new Date() }, 
					function(err, body) {
						if(err)
						{
							console.log(D(), ('fail update MESSAGES_RECEIVED_'+h+'_HOUR').bold.red, err);
							return;
						}
						//console.log(D(), ('updated MESSAGES_RECEIVED_'+h+'_HOUR').bold.blue, count);
					}
				);
			}
			
			
		});
	});
}
