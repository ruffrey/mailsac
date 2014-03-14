#!/bin/sh


### FIRST STEPS: ###
# Ubuntu server 12.04
#
# 0. Setup ssh key
	#	cd /root
	#	ssh-keygen
	#(then enter a password, in this case it is:)
	#	mailsac
	#	mailsac
	#	cd .ssh
	#	ssh-agent /bin/bash
	#	ssh-add id_rsa
	#	cat id_rsa.pub     (then add to git repo)
#
# 1. apt-get update && apt-get upgrade && apt-get install git nano
# 2. cd /root && git clone <your repo>
# 3. Check paths and ENV vars in start.sh 
# 		(use whereis to confirm path locations for binaries)
# 4. cd mailsac/scripts && sh cfgserver.sh

# uninstall unnecessary stuff
	# echo "$(date) Unstalling Apache"
	# 	apt-get remove --purge apache2 apache2-utils
	
	echo "$(date) Unstalling sendmail and postfix"
		apt-get remove sendmail sendmail-bin postfix
		apt-get purge postfix exim4 sendmail sendmail-bin
	
# install deps
	echo "$(date) - Installing mailapp dependencies"
		apt-get install curl python-software-properties g++ python make nodejs npm
		
		#add-apt-repository ppa:chris-lea/node.js
		#apt-get update
		#apt-get install nodejs npm
		
	echo "$(date) - Installing Forever"
		npm install forever -g
	

# Putting startup script in place
echo "$(date) - Copying startup script"
	cp /root/mailsac/scripts/start.sh /root

# CRON job
echo "$(date) - Creating cron job"
	cp /root/mailsac/scripts/mailsac /etc/cron.d/mailsac

# finish message
echo "$(date) - Server has finished configuring."

# boot app
echo "$(date) - Rebooting in 5"
	sleep 1
echo "$(date) - Rebooting in 4"
	sleep 1
echo "$(date) - Rebooting in 3"
	sleep 1
echo "$(date) - Rebooting in 2"
	sleep 1
echo "$(date) - Rebooting in 1"
	sleep 1

reboot
