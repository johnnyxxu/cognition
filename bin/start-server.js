#!/usr/bin/env node

var usage = 'Usage (as unprivilaged user): start-server.js /path/to/conf.json'

var http = require('http'),
    https = require('https'),
    path = require('path'),
    fs = require('fs');

// load conf
try {
  var conf = JSON.parse(fs.readFileSync(process.argv[2], {encoding:'utf8'}));
} catch (err) {
  console.log(err);
  console.log();
  console.log(usage);
  process.exit(1);
}

// evaluate variables in conf
for (var key in conf) {
  if (typeof conf[key] == 'string' && conf[key].indexOf('$cog_root') >= 0){
    conf[key] = conf[key].replace('$cog_root', conf['cog_root']);
  }
}

var httpsOptions = {
  key: fs.readFileSync(conf.ssl_key),
  cert: fs.readFileSync(conf.ssl_cert)
};

var app = require(path.join(conf.cog_root, 'app'))(conf);

http.createServer(app).listen(conf.http_port);
https.createServer(httpsOptions, app).listen(conf.https_port);

console.log('server started');
