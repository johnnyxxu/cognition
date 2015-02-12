// Unit tests for the docs API.

var express = require('express'),
    dbtool = require('./tools/dbtool'),
    request = require('supertest'),
    should = require('should'),
    async = require('async'),
    Doc, docs, app;

var testData = [
  { name: 'first',  content: 'Ladies first.' },
  { name: 'second', content: 'Number 2' },
  { name: 'third',  content: 'Best for last.' }
]

function loadTestData(done) {
  async.parallel([
    function(cb) {
      Doc.create(testData[0], cb);
    },
    function(cb) {
      Doc.create(testData[1], cb);
    },
    function(cb) {
      Doc.create(testData[2], cb);
    },
  ], done);
}

before(function(done) {
  dbtool.open(function(err) {
    if (err)
      return done(err);
    Doc = require('../models/document');
    docs = require('../routes/docs');
    app = express();
    app.use(docs);
    done();
  });
});

beforeEach(loadTestData);

afterEach(function(done) {
  Doc.remove({}, done);
});

//after(dbtool.close);

describe('docs', function() {
  describe('route /', function() {
    describe('GET', function() {
      it('should get all the docs and without _id or __v', function(done) {
        var exp = { status:'OK', method:'GET', errors:[] };
        request(app)
          .get('/')
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.payload.should.be.an.Array.and.have.length(3);
            for (var i in testData)
              res.body.payload.should.containEql(testData[i]);
            done();
          });
      });

      it('should fail on invalid Accept', function(done) {
        var exp = { status:'Not Acceptable', method:'GET', payload:{} };
        request(app)
          .get('/')
          .set('Accept', 'text/html')
          .expect(406)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            done();
          });
      });
    }); // end describe GET

    describe('POST', function() {
      it('should save new documents', function(done) {
        var names = ['new_guy', 'Test', '_', '-', '012345-6789', 0, -1];
        async.each(names, function(name, cb) {
          var req = { name: name, content: 'test content' },
              exp = { status:'Created',method:'POST',payload:req,errors:[] };
          request(app)
            .post('/')
            .set('Accept', 'application/json')
            .send(req)
            .expect(201)  // 201 created
            .expect('Content-Type', /json/)
            .end(function(err, res) {
              if (err) return cb(err);
              // convert name to string to cover number cases
              exp.payload.name = exp.payload.name.toString();
              res.body.should.eql(exp);
              Doc.find(req, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(1);
                cb();
              });
            });
        }, done);
      });

      it('should not be able to POST duplicate name', function(done) {
        var dupe = { name: testData[1].name, content: "I'm already in there" },
            exp = {status: 'Conflict', method: 'POST', payload:{}};
        request(app)
          .post('/')
          .set('Accept', 'application/json')
          .send(dupe)
          .expect(409)  // 409 conflict
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              docs.should.not.containEql(dupe);
              done();
            });
          });
      });

      it('should not be able to POST without name', function(done) {
        var req = { content:'only content, no name' },
            exp = { status: 'Bad Request', method: 'POST', payload: {} };
        request(app)
          .post('/')
          .set('Accept', 'application/json')
          .send(req)
          .expect(400) // bad request
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              docs.should.not.containEql(req);
              done();
            });
          });
      });

      it('should not be able to POST invalid name', function(done) {
        var names = [ null, '', '\\', '\\"', 'has space', "I'mInvalid", 't%st',
          '♪tunes', '#hashtag', 'double"quotes', '\n'
        ];
        async.each(names, function(name, cb) {
          var req = {name: name, content: 'whatever'},
              exp = {status: 'Bad Request', method: 'POST', payload: {} };
          request(app)
            .post('/')
            .set('Accept', 'application/json')
            .send(req)
            .expect(400)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
              if (err) return cb(err);
              res.body.should.have.properties(exp);
              res.body.errors.should.have.length(1);
              Doc.find({}, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(testData.length);
                docs.should.not.containEql(req);
                cb();
              });
            });
        }, done);
      });

      it('should fail on invalid Accept', function(done) {
        var req = { name: 'something', content: 'something else' },
            exp = { status:'Not Acceptable', method:'POST', payload:{} };
        request(app)
          .post('/')
          .set('Accept', 'text/html')
          .send(req)
          .expect(406)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              docs.should.not.containEql(req);
              done();
            });
          });
      });

      it('should fail when POSTing invalid json', function(done) {
        var req = '{ not json ',
            exp = { status:'Bad Request', method:'POST', payload:{} };
        request(app)
          .post('/')
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send(req)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              docs.should.not.containEql(req);
              done();
            });
          });
      });
    }); // end describe POST

    describe('DELETE', function() {
      it('should not be able to DELETE', function(done) {
        var exp = { status:'Method Not Allowed', method:'DELETE', payload:{} };
        request(app)
          .del('/')
          .set('Accept', 'application/json')
          .expect(405) // method not allowed
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              done();
            });
          });
      });
    }); // end describe DELETE
  }); // end describe route /

  describe('route /:name', function() {
    describe('GET', function() {
      it('should get the named doc and without _id or __v', function(done) {
        var exp = {status:'OK',method:'GET',errors:[],payload:testData[0]};
        request(app)
          .get('/' + testData[0].name)
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(exp);
            done();
          });
      });

      it("should fail if :name doesn't exist", function(done) {
        var exp = {status:'Not Found',method:'GET',payload:{}};
        request(app)
          .get('/absent')
          .set('Accept', 'application/json')
          .expect(404) // not found
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            done();
          });
      });

      it('should fail on invalid Accept', function(done) {
        var exp = { status:'Not Acceptable', method:'GET', payload:{} };
        request(app)
          .get('/not_here')
          .set('Accept', 'text/html')
          .expect(406)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            done();
          });
      });
    }); // end describe GET

    describe('POST', function() {
      it('should not be able to POST to new or existing', function(done) {
        var names = [ 'new-name', testData[2].name ];
        async.each(names, function(name, cb) {
          var req = {name: name, content: 'whatever'},
              exp = { status:'Method Not Allowed', method:'POST', payload:{} };
          request(app)
            .post('/' + req.name)
            .set('Accept', 'application/json')
            .send(req)
            .expect(405)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
              if (err) return cb(err);
              res.body.should.have.properties(exp);
              res.body.errors.should.have.length(1);
              Doc.find({}, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(testData.length);
                for (var i in docs)
                  docs[i].should.not.have.property('content', req.content);
                cb();
              });
            });
        }, done);
      });
    }); // end describe POST

    describe('PUT', function() {
      it('should update existing doc by :name', function(done) {
        var req = { name: testData[2].name, content: 'new content' },
            exp = { status:'OK', method:'PUT', errors:[], payload:req };
        request(app)
          .put('/' + req.name)
          .set('Accept', 'application/json')
          .send(req)
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(exp);
            Doc.find({name: req.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              docs[0].should.have.properties(req);
              done();
            });
          });
      });

      it("should fail if :name doesn't exist", function(done) {
        var req = { name: 'nonExistant', content: 'new content' },
            exp = { status:'Not Found', method:'PUT', payload:{} };
        request(app)
          .put('/' + req.name)
          .set('Accept', 'application/json')
          .send(req)
          .expect(404) // 404 not found
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({name: req.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.be.empty;
              done();
            });
          });
      });

      it('should not be able to rename to existing name', function(done) {
        var existing = testData[0],
            req = { name: testData[1].name, content: 'whatever' },
            exp = { status:'Conflict', method:'PUT', payload:{} };
        request(app)
          .put('/' + existing.name)
          .set('Accept', 'application/json')
          .send(req)
          .expect(409)  // conflict
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({name: existing.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              docs[0].should.have.property('content', existing.content);
              done();
            });
          });
      });

      it('should not be able to set invalid name', function(done) {
        var names = [ null, '', '\\', '\\"', 'has space', "I'mInvalid", 't%st',
          '♪tunes', '#hashtag', 'double"quotes', '\n'
        ];
        async.each(names, function(name, cb) {
          var req = {name: name, content: 'whatever'},
              exp = {status:'Bad Request', method:'PUT', payload:{} };
          request(app)
            .put('/' + testData[2].name)
            .set('Accept', 'application/json')
            .send(req)
            .expect(400) // bad request
            .expect('Content-Type', /json/)
            .end(function(err, res) {
              if (err) return cb(err);
              res.body.should.have.properties(exp);
              res.body.errors.should.have.length(1);
              Doc.find({name: testData[2].name}, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(1);
                docs[0].should.have.property('content', testData[2].content);
                cb();
              });
            });
          }, done);
      });

      it('should fail on invalid Accept', function(done) {
        var req = { name: 'something', content: 'something else' },
            exp = { status:'Not Acceptable', method:'PUT', payload:{} };
        request(app)
          .put('/' + testData[0].name)
          .set('Accept', 'text/html')
          .send(req)
          .expect(406)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              docs.should.not.containEql(req);
              done();
            });
          });
      });

      it('should fail when PUTting invalid json', function(done) {
        var req = 'no json here }',
            exp = { status:'Bad Request', method:'PUT', payload:{} };
        request(app)
          .put('/' + testData[1].name)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .send(req)
          .expect(400)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              docs.should.not.containEql(req);
              done();
            });
          });
      });
    }); // end describe PUT

    describe('DELETE', function() {
      it('should delete the doc by :name', function(done) {
        var exp = {status:'OK',method:'DELETE',payload:testData[0],errors:[]};
        request(app)
          .del('/' + testData[0].name)
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(exp);
            Doc.find({name: testData[0].name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.be.empty;
              done();
            });
          });
      });

      it("should not DELETE if :name doesn't exist", function(done) {
        var exp = {status:'Not Found', method:'DELETE', payload:{}};
        request(app)
          .del('/absent')
          .set('Accept', 'application/json')
          .expect(404)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              done();
            });
          });
      });

      it('should fail on invalid Accept', function(done) {
        var exp = { status:'Not Acceptable', method:'DELETE', payload:{} };
        request(app)
          .del('/' + testData[1].name)
          .set('Accept', 'text/html')
          .expect(406)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.have.properties(exp);
            res.body.errors.should.have.length(1);
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(testData.length);
              done();
            });
          });
      });
    }); // end describe DELETE
  }); // end describe route /:name
}); // end describe docs
