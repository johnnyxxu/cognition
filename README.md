Cognition
=========

A simple web service for storing and fetching information and records.

I started this project because I'm not completely comfortable storing all of
my personal stuff "in the cloud" on someone else's server. I would rather host
it myself - which means I can build it how it should be (simple) and also
learn something as I go.

Currently, there's just a simple /api/docs API for keeping generic documents.

Setup
-----
I've only run this myself on Arch linux but the steps should be similar for
other distros. Install [node][node] and [mongodb][mongo].
You'll also need `gcc`, `make`, and `python2` for node-gyp. On Arch (as root):

    pacman -Sy --needed nodejs npm mongodb gcc make python2
    systemctl start mongodb
    systemctl enable mongodb

Clone the project and install dependencies:

    git clone https://github.com/tylerbrazier/cognition
    cd cognition
    npm config set python /usr/bin/python2
    npm install

Copy `example.conf.js` to `conf.js` and edit it.

To use HTTPS, you'll need a key and certificate. This project includes a
`dev.key.pem` and `dev.cert.pem` for development. Never use these in production
since the key is public on github! I have some separate instructions on how to
generate your own key and cert in [this][ssl/tls] doc.

To use basic authentication, you'll need to create a user.
There's a `mkauth.js` script included in this project for that:

    mkauth.js user:pass mongodb://host/db

This will add `user` to the `db` database with a hashed `pass`.
This user should now be able to log in to any routes requiring basic auth.

Run it
------
Note that for security, you should NOT run the server as root.
However, without root, you won't be able to listen on ports 80 and 443.
For development, you can configure the server to listen for http and https
on higher ports such as 8080 and 8443.
In production, you might consider using [iptables][iptables-wiki] to redirect
traffic on 80 and 443 to those higher ports.
I have some separate [notes][iptables-guide] on how to do that.

To run the server:

    node server.js [conf]

The `[conf]` argument is optional; if omitted, it defaults to your `conf.js`.
Alternatively, you can start the server with `npm`:

    npm start

Browse to `http://localhost:8080`.

Testing
-------
To run unit tests, edit `test/tools/conf.js` and run `npm test` from the
project root directory.

TODO
----
- HTML UI for the REST docs
- More content, APIs

[node]:             http://nodejs.org/
[mongo]:            http://www.mongodb.org/
[iptables-wiki]:    https://wiki.archlinux.org/index.php/iptables
[iptables-guide]:   https://github.com/tylerbrazier/linux/blob/master/docs/iptables.md
[ssl/tls]:          https://github.com/tylerbrazier/linux/blob/master/docs/server.md
