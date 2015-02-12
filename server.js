#!/usr/bin/env node

var usage = 'Usage (as unprivilaged user): node server.js [conf.json]';

var http = require('http'),
    https = require('https'),
    fs = require('fs'),
    path = require('path'),
    builder = require('./tools/conf-builder'),
    confPath, conf;

try {
  confPath = process.argv[2] || path.join(__dirname, 'conf.json');
  conf = builder.build(require(path.resolve(confPath)));
} catch (err) {
  console.error(err);
  console.error(usage);
  process.exit(1);
}

var httpsOptions = {
  key: fs.readFileSync(conf.paths.sslKey),
  cert: fs.readFileSync(conf.paths.sslCert)
};

var app = require('./app')(conf);

http.createServer(app).listen(conf.ports.http);
https.createServer(httpsOptions, app).listen(conf.ports.https);

console.log('Listening on '+conf.ports.http+', '+conf.ports.https);
