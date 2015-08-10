#! /bin/bash

CONF_DIR=/etc/init
CONF_FILE=$CONF_DIR/mailsac.conf
LOG_FILE=/var/log/mailsac.log
LOGROTATE_FILE=/etc/logrotate.d/mailsac
LOGROTATE_CONFIG="$LOG_FILE {
    weekly
    rotate 26
    size 10M
    create
    su root
    compress
    delaycompress
    postrotate
        service mailsac restart > /dev/null
    endscript
}
"


# dependencies
sudo apt-get update;
sudo apt-get remove -y sendmail sendmail-bin postfix apache2;
sudo apt-get purge -y postfix exim4 sendmail sendmail-bin;
sudo apt-get install -y git curl nano build-essential python2.7 mongodb redis-server;
curl -sL https://deb.nodesource.com/setup_0.12 | sudo -E bash -;
sudo apt-get install -y nodejs;

# Clone and setup the application
cd /opt;
sudo rm -rf mailsac;
sudo git clone https://github.com/ruffrey/mailsac.git mailsac --depth 1;
cd mailsac;
sudo npm i --production;

# Setup init scripts
sudo rm -f $CONF_FILE;
sudo cp -f install/mailsac.conf $CONF_DIR;
sudo chmod +x $CONF_FILE;

# Setup log rotation
sudo touch $LOG_FILE;
sudo rm -f $LOGROTATE_FILE;
echo "$LOGROTATE_CONFIG" | sudo tee --append "$LOGROTATE_FILE";

# Ensure proper syntax and load the conf
init-checkconf -d /etc/init/mailsac.conf;
sudo service mailsac start;

echo \n\nSuccess - installed at /opt/mailsac;
echo Edit configuration at $CONF_FILE, then run \'sudo service mailsac restart\';
echo Check startup logs at /var/log/upstart/mailsac.log;
echo Check mailsac logs at $LOG_FILE;
