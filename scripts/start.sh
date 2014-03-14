#!/bin/sh

sudo service mongodb start

if [ $(ps aux | grep $USER | grep node | grep -v grep | wc -l | tr -s "\n") -eq 0 ]
then
        export NODE_ENV=prod
		
		echo "$(date) Forever not running, will try to start the app."
        /usr/local/bin/node /usr/local/bin/forever start /root/mailsac/app.js
        /usr/local/bin/node /usr/local/bin/forever start /root/mailsac/smtp.js
        
else
	echo "$(date) Node or Forever is running, no need to start."
fi

