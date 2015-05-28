// unit tests for mkauth.js util

var exec = require('child_process').exec,
    dbtool = require('./tools/dbtool'),
    should = require('should'),
    bcrypt = require('bcrypt'),
    db = require('./conf.json').db,
    path = require('path'),
    script = path.join(__dirname, '..', 'tools', 'mkauth.js'),
    User;

before(function(done) {
  dbtool.open(function(err) {
    if (err)
      return done(err);
    User = require('../models/user');
    done();
  });
});

beforeEach(function(done) {
  User.remove({}, done);
});

function call(args, callback) {
  exec('node ' + script + ' ' + args.join(' '), callback);
}

describe('mkauth', function() {

  it('should store user:pass in the db with hashed password', function(done) {
    this.timeout(0); // disable timeout because bcrypt will need time
    var name = 'tyler',
        password = "super_secret_password";
    call([name+':'+password, db], function(err, stdout, stderr) {
      if (err) return done(err);
      User.find({}, function(err, users) {
        if (err) return done(err);
        users.should.have.length(1);
        var user = users[0];
        user.should.have.property('name', name);
        user.should.have.property('password');
        bcrypt.compare(password, user.password, function(err, match) {
          if (err) return done(err);
          match.should.be.true;
          done();
        });
      });
    });
  });

  it('should fail if given bad user:pass', function(done) {
    call(['nocolon', db], function(err, stdout, stderr) {
      err.should.not.be.null;
      User.find({}, function(err, users) {
        if (err) return done(err);
        users.should.have.length(0);
        done();
      });
    });
  });

  it('should not allow duplicate usernames', function(done) {
    var a = 'rono:whoareu',
        b = 'rono:theboss';
    call([a, db], function(err, stdout, stderr) {
      if (err) return done(err);
      call([b, db], function(err, stdout, stderr) {
        err.should.not.be.null;
        User.find({}, function(err, users) {
          if (err) return done(err);
          users.should.have.length(1);
          users[0].should.have.property('name', 'rono');
          done();
        });
      });
    });
  });

});
