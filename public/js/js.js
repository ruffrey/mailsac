var SUCCESS = '<div class="alert alert-success notif"><button type="button" class="close" data-dismiss="alert">&times;</button>{{message}}</div>',

	FAIL = '<div class="alert notif"><button type="button" class="close" data-dismiss="alert">&times;</button>{{message}}</div>';


// crappy mustache templater
function crapstash(t, m) {
	return t.replace(/\{\{message\}\}/g,m);
}

function crapstash2(t, o) {
	var re = new RegExp();
	for(var _o in o)
	{
		re = new RegExp('\\{\\{'+_o+'\\}\\}','gm');
		t=t.replace(re,o[_o]);
	}
	return t;
}

function ApiSuccess(data) {
	if(data.success==false && data.errors && data.errors instanceof Array)
	{
		$.each(data.errors, function(i, val){
			$('div#notification_area').append(
				crapstash(FAIL, val)
			);
		});
		return;
	}
	else if(data.success==false && data.errors)
	{
		$('div#notification_area').append(
			crapstash(FAIL, data.errors)
		);
		return;
	}
	else if(data.success==false && data.message)
	{
		$('div#notification_area').append(
			crapstash(FAIL, data.message)
		);
		return;
	}
	
	else if(data.success==false)
	{
		$('div#notification_area').append(
			crapstash(FAIL, 'Something broke, somewhere.')
		);
		return;
	}	
	
	$('div#notification_area').append(
		crapstash(SUCCESS, data.message || 'Ok')
	);
}

function ApiSuccessWrap(i_cb){
	
	return function(data) {
		ApiSuccess(data);
		i_cb(data);
	};
}

function ApiFail(jqx, st, rtxt) {
	$('div#notification_area').append(
		crapstash(FAIL, rtxt)
	);
}

function ApiCall(path) {
	var cb = arguments[1] || false;
	var api_method = arguments[2] || 'get';
	
	$.ajax({
		type: api_method,
		url: path,
		success: function(data) {
			if(data.success==false && data.errors && data.errors instanceof Array)
			{
				$.each(data.errors, function(i, val){
					$('div#notification_area').append(
						crapstash(FAIL, val)
					);
				});
				return;
			}
			else if(data.success==false && data.errors)
			{
				$('div#notification_area').append(
					crapstash(FAIL, data.errors)
				);
				return;
			}
			else if(data.success==false && data.message)
			{
				$('div#notification_area').append(
					crapstash(FAIL, data.message)
				);
				return;
			}
			
			else if(data.success==false)
			{
				$('div#notification_area').append(
					crapstash(FAIL, 'Something broke, somewhere.')
				);
				return;
			}
			
			
			if(!cb)
			{
				$('div#notification_area').append(
					crapstash(SUCCESS, data.message || 'Ok')
				);
				return;
			}
			cb(data);
		},
		error: ApiFail
	});
}



//
// init
//
$(function(){
	
	$('form.inboxSearch').submit(function(e){
		e.preventDefault();
		var $inbx = $(this).find('.txtInbox'),
			$dmn = $(this).find('.domain');
		console.log($inbx.val(), $dmn.val());
		if($inbx.val().length>0 && $dmn.val().length>0)
		{
			open('/inbox/'+$inbx.val()+'@'+$dmn.val(),'_self');
		}
		else{
			var $btn = $(this).children().find('.btn');
			
			$btn.removeClass('btn-success').addClass('btn-danger');
			
			if($inbx.val().length==0)
			{
				$inbx.addClass('input-error');
			}
			
			if($dmn.val().length==0)
			{
				$dmn.addClass('input-error');
			}
			
			
			setTimeout(function() {
				$btn.addClass('btn-success').removeClass('btn-danger');
				$inbx.removeClass('input-error');
				$dmn.removeClass('input-error');
			},1000);
			
		}
		
	});
	
	
	
	$(document).ajaxStart(function(){
		$('div#ajaxLoader').show();
	}).ajaxStop(function(){
		$('div#ajaxLoader').hide();
	}).ajaxError(function(){
		$('div#ajaxLoader').hide();
	});
	
	if(location.hash)
	{
		$('div[data-target="'+location.hash+'"]').click();
	}
});

function DeleteMessage(id) {
	$.ajax({
		url: '/api/item/'+id+'/delete',
		type: 'post',
		success: ApiSuccessWrap(function(data){
			var mtot = parseFloat(
				document.title
				.split('(')[1]
				.split(')')[0]
			);
			
			if(!isNaN(mtot)) 
			{
				document.title = document.title
					.replace(
						/\(.+\)/,
						'(' + (mtot-1) + ')'
					);
			}
		}),
		error: ApiFail
	});
}
var m = (Math.random() * (120.416 - 76.111) + 75.522);
var _rel = (Math.random() * (m - 17.431) + 16.593) * 1000;
//console.log(_rel);
setTimeout(function(){
	location.reload();
}, _rel);
