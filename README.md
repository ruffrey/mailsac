# Mailsac v2

The *receive-only* mail server powering [Mailsac.com](https://mailsac.com).

You can throw it onto a server pretty easily and use it for testing *incoming* email.

Mailsac >=2.0.0 is a complete rewrite and not compatible with <2.0.0.

## Setup

### Instructions for Ubuntu 14.04

On a fresh server, download the script `./install/ubuntu-1404.sh` and run it:

```bash
wget https://raw.githubusercontent.com/ruffrey/mailsac/master/install/ubuntu-1404.sh
sudo sh ubuntu-1404.sh
```

Or from a local version of the repository:

```bash
ssh root@MYHOSTNAME 'bash -s' < install/ubuntu-1404.sh
```

### Instructions for everything else
Remove or disable any services that are bound to ports 25 and 587. These are
used by SMTP and required by the Mailsac `./smtp-server.js`.

## Redeploy

There is a helper script `./deploy` which can be used to deploy the current
directory to a remote server where Mailsac has been installed.

```bash
./deploy root@mailsac.com # assumes your ssh key is on host
```

#### Deps

* Node.js >= 0.12.0
* MongoDB
* Redis
* Nothing blocking the mail ports (25 and 587)

#### Running

`node app`

There are `DEBUG=` environment variables which
will help with troubleshooting. See `./package.json` - `"scripts"`.

### Advanced configuration

Change `./config/default.json` or add config files matching `NODE_ENV` environment variable. See more instructions for `node-config`: https://github.com/lorenwest/node-config/wiki

## Not for Node.js cloud hosts

Mailsac runs on VPS or bare servers.

It will not work on Node.js cloud services (like AppFog, Heroku) because they won't give you access to SMTP ports.

You could use a service like Docker to manage and deploy Node.js apps on a VPS. Or just deploy to a normal VPS
using the `./deploy` script, git, or something else.

## Plugins

Pluggable features can be added to Mailsac.

There are hooks into the UI application and SMTP processes.

An example plugin is found in the `./plugins/` folder. See it for details.

A plugin must either be:
* a file with `.plugin.js` as the extension

You can extend the base `./views/layout.jade` template by having the following jade files
in your plugin folder.

* `./plugins/myexample.plugin/includes/head.jade`
* `./plugins/myexample.plugin/includes/footer.jade`

```javascript

```

# Development

Follow the code quality guidelines by running:

```bash
npm run lint
```

Pull requests against master are welcome.

# License

MIT

Copyright (c) 2012 - 2015 Jeff H. Parrish

The code written for the Mailsac project is covered by the LICENSE
file at the root of this project. All other code is copyright and licensed
under its respective licensors.
