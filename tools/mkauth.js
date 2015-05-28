#!/usr/bin/env node

// Usage:
//     node mkauth.js username:password mongodb://host/db
//
// When hashing, bcrypt will use 2^rounds iterations of processing.
// As noted in bcrypt's readme, on a 2GHz processor you can expect:
// rounds=8 : ~40 hashes/sec
// rounds=9 : ~20 hashes/sec
// rounds=10: ~10 hashes/sec
// rounds=11: ~5  hashes/sec
// rounds=12: 2-3 hashes/sec
// rounds=13: ~1 sec/hash
// rounds=14: ~1.5 sec/hash
// rounds=15: ~3 sec/hash
// rounds=25: ~1 hour/hash
// rounds=31: 2-3 days/hash
var ROUNDS = 8;

var bcrypt = require('bcrypt'),
    mongoose = require('mongoose'),
    User = require('../models/user'),
    creds = process.argv[2],
    dbName = process.argv[3];

function disconnect() {
  if (mongoose.connection.readyState === 1)
    mongoose.disconnect();
}

function fail(msg) {
  console.error(msg);
  disconnect();
  process.exit(1);
}

if (!creds || creds.indexOf(':') == -1 || !dbName)
  return fail('Usage: node mkauth.js user:pass mongodb://host/db');

mongoose.connect(dbName, function(err) {
  if (err)
    return fail(err);

  var userPass = creds.split(':'),
      user = userPass[0],
      pass = userPass[1];

  bcrypt.genSalt(ROUNDS, function(err, salt) {
    if (err)
      return fail(err);
    bcrypt.hash(pass, salt, function(err, hash) {
      if (err)
        return fail(err);
      User.create({
        name: user,
        password: hash
      }, function(err, user) {
        if (err)
          return fail(err);
        console.log(user);
        disconnect();
      });
    });
  });
});
