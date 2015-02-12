Cognition
=========

A simple web service for storing and fetching information and records.

I started this project because I'm not completely comfortable storing all of
my personal stuff "in the cloud" on someone else's server. I would rather host
it myself - which means I can build it how it should be (simple) and also
learn something as I go.

Currently, there's just a /docs RESTful API for keeping generic documents.

Start
-----
I've only run this myself on Arch linux but the steps should be similar for
other distros. Install [node][node] and [mongodb][mongo].
You'll also need `gcc`, `make`, and `python2` for node-gyp. On Arch (as root):

    pacman -Sy --needed nodejs mongodb gcc make python2
    systemctl start mongodb
    systemctl enable mongodb

Clone the project and install dependencies:

    git clone https://github.com/tylerbrazier/cognition
    cd cognition
    npm config set python /usr/bin/python2
    npm install

The **Testing** section below describes how to configure and run the unit tests.

Copy `example.conf.json` to `conf.json` and edit it.
See the **Configuration** section below for more info.

To use HTTPS, you'll need a key and certificate. If you don't already have
those, I have some instructions [here][ssl/tls].

To use basic authentication, you'll need to hash a username and password.
There's a `tools/mkauth.js` script included in this project for that purpose:

    tools/mkauth.js user:pass

This will output the hashed value for the given credentials. Add the hash
to the `auths` array in `conf.json` to allow 'user' to login with 'pass'.

Note that for security, you should NOT run the server as root.
However, without root, you won't be able to listen on ports 80 and 443.
For development, you can configure the server to listen for http and https
on higher ports such as 8080 and 8443.
In production, you might consider using [iptables][iptables-wiki] to redirect
traffic on 80 and 443 to those higher ports.
I have some separate [notes][iptables-guide] on how to do that.

To run the server:

    node server.js [conf]

The `[conf]` argument is optional; if omitted, it defaults to your `conf.json`.
Alternatively, you can start the server with `npm`:

    npm start

Configuration
-------------
The server reads these properties from `conf.json`:

- `ports`
  - `http`: the http port to listen on; defaults to `8080`
  - `https`: the https port to listen on; defaults to `8443`
- `paths` (non-absolute paths will be relative to the project root)
  - `sslKey`: path to the ssl key used for https; defaults to `ssl/dev.key.pem`
  - `sslCert`: path to the ssl cert used for https; defaults to `ssl/cert.pem`
- `auths`: array of hashed user:password entries allowed for basic auth;
  defaults to an array with a single hash for `test:test`
- `authRealm`: the Basic realm used for https; defaults to `Secret Stuff`
- `db`: the mongodb URI; defaults to `mongodb://localhost/test`
- `serveIndex`: array of static directories to serve; each entry in the array
  is an object with these properties:
  - `route`: the route
  - `path`: the local path to the directory to serve files from
  - `secure`: boolean - if true, route will be secured with ssl and basic auth
  - `options`: options object passed to [serve-index][serve-index opts]

By default, the `serveIndex` array contains a single entry:

    {
      route: '/public',
      path: 'web/public',
      secure: false,
      options: {
        icons: true,
        views: 'details'
      }
    }

Testing
-------
Before running unit tests, edit `test/conf.json` to configure the tests:

- `db`: The test database to use.
  If unset, defaults to `mongodb://localhost/test`.
- `useMockgoose`: if set, the tests will use
  [mockgoose][mockgoose] instead of a real db.
- `preDrop`: if set, the database will be dropped upon connecting.
- `postDrop`: if set, the database will be dropped before disconnecting.

For whatever reason, mockgoose currently doesn't work but using a real db does.

Run `npm test` to run all unit tests.

TODO
----
- HTML UI for the REST docs
- More content, APIs

[mockgoose]:        https://www.npmjs.org/package/mockgoose
[node]:             http://nodejs.org/
[mongo]:            http://www.mongodb.org/
[iptables-wiki]:    https://wiki.archlinux.org/index.php/iptables
[iptables-guide]:   https://github.com/tylerbrazier/archlinux/blob/master/docs/server.md#ip-tables
[serve-index opts]: https://www.npmjs.com/package/serve-index#options
[ssl/tls]:          https://github.com/tylerbrazier/archlinux/blob/master/docs/server.md#certs
