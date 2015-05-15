// unit tests for secure.js middleware

var express = require('express'),
    dbtool = require('./tools/dbtool'),
    request = require('supertest'),
    should = require('should'),
    async = require('async'),
    bcrypt = require('bcrypt'),
    secure, app, User;

var OK_RES = 'success',
    FAIL_RES = 'fail';

var testData = [
  { username: 'tyler', password: "don't_guess_me" },
  { username: 'arnold', password: 'chappa!' }
];

function loadTestData(done) {
  async.parallel([
    function(cb) {
      bcrypt.hash(testData[0].password, 4, function(err, hash) {
        if (err) return cb(err);
        User.create({ username:testData[0].username, password: hash }, cb);
      });
    },
    function(cb) {
      bcrypt.hash(testData[1].password, 4, function(err, hash) {
        if (err) return cb(err);
        User.create({ username:testData[1].username, password: hash }, cb);
      });
    }
  ], done);
}

before(function(done) {
  dbtool.open(function(err) {
    if (err) return done(err);
    secure = require('../middleware/secure');
    User = require('../models/user');
    app = express();
    app.set('conf', {authRealm: 'realm'});
    app.use(secure.auth);  // just test auth for now
    // for handling success
    app.use(function(req, res, next) {
      res.send(OK_RES);
    });
    // for handling failures
    app.use(function(err, req, res, next) {
      res.send(FAIL_RES);
    });
    done();
  });
});

afterEach(function(done) {
  User.remove({}, done);
});

describe('secure middleware', function() {
  describe('auth', function() {
    // tests have different HTTP methods just for diversification

    it('should authenticate a valid user (GET)', function(done) {
      loadTestData(function(err) {
        if (err) return done(err);
        request(app)
          .get('/')
          .auth(testData[0].username, testData[0].password)
          .expect(200, OK_RES)
          .end(done);
      });
    });

    it('should reject an invalid user (POST)', function(done) {
      request(app)
        .post('/')
        .auth('somebody', 'whatever')
        .expect(401, FAIL_RES)
        .end(done);
    });

    it('should reject if password is bad (PUT)', function(done) {
      loadTestData(function(err) {
        if (err) return done(err);
        request(app)
          .put('/')
          .auth(testData[0].username, 'not correct')
          .expect(401, FAIL_RES)
          .end(done);
      });
    });

    it('should reject if no authorization is given (DELETE)', function(done) {
      loadTestData(function(err) {
        if (err) return done(err);
        request(app)
          .del('/')
          .expect(401, FAIL_RES)
          .end(done);
      });
    });

  });
});
