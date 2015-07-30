#!/usr/bin/env node

var usage = 'Usage (as unprivilaged user): node server.js [conf.js]';

var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    conf = require('./conf.js'),
    app = require('./app')(conf);

// TODO for now we just resolve relative paths when they're used; consider
// doing this for all conf.path before passing the conf anywere
var httpsOptions = {
  key: fs.readFileSync(path.resolve(__dirname, conf.paths.tlsKey)),
  cert: fs.readFileSync(path.resolve(__dirname, conf.paths.tlsCert))
};

http.createServer(app).listen(conf.ports.http);
https.createServer(httpsOptions, app).listen(conf.ports.https);

console.log('Listening on '+conf.ports.http+', '+conf.ports.https);
