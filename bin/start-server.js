#!/usr/bin/env node

var usage = 'Usage (as unprivilaged user): start-server.js /path/to/conf.json'

var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    builder = require('../lib/conf-builder');

try {
  var conf = builder.parse(process.argv[2]);
} catch (err) {
  console.log(err);
  console.log(usage);
  process.exit(1);
}

var httpsOptions = {
  key: fs.readFileSync(conf.paths.ssl_key),
  cert: fs.readFileSync(conf.paths.ssl_cert)
};

var app = require('../lib/app')(conf);

http.createServer(app).listen(conf.ports.http);
https.createServer(httpsOptions, app).listen(conf.ports.https);

console.log('server started');
