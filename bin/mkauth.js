#!/usr/bin/env node

// Call like `node mkauth.js username:password` to write a hashed username and
// password to stdout. The hash uses a salt of size 8.

var bcrypt = require('bcrypt'),
    saltsize = 8,
    creds = process.argv[2];

if (!creds || creds.indexOf(':') == -1) {
  console.log('Usage: node mkauth.js username:password');
  process.exit(1);
}

var encoded = new Buffer(creds).toString('base64');
console.log(encoded);
bcrypt.hash(encoded, saltsize, function(err, hash){
  console.log(hash);
});
