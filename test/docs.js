// tests for the docs API.

var express = require('express'),
    dbtool = require('./tools/dbtool'),
    supertest = require('supertest'),
    should = require('should'),
    async = require('async'),
    Types = require('mongoose').Types,
    Doc, User, // models
    docs,      // docs middleware
    simpleApp; // simpleApp has no middleware for setting req.user

var userIds = [ Types.ObjectId(), Types.ObjectId() ];

var data = {
  users: [
    { name: 'Arnold',   password: 'lift',     _id: userIds[0] },
    { name: 'El Guapo', password: 'sweater!', _id: userIds[1] }
  ],
  owned: [
    { name: 'How_to_be_champ', body: 'be arnold', user: userIds[0] },
    { name: 'breakfast',       body: 'wheaties',  user: userIds[0] },
    { name: 'plethora',        body: '',          user: userIds[1] }
  ],
  unowned: [
    // each will have a null user field
    { name: 'outcast', body: ' :( '     },
    { name: 'lonely',  body: 'marooned' }
  ]
};

before(function(done) {
  dbtool.open(function(err) {
    if (err) return done(err);
    Doc = require('../models/document');
    User = require('../models/user');
    docs = require('../routes/docs');
    simpleApp = express();
    simpleApp.use(docs);
    done();
  });
});

beforeEach(function(done) {
  // clean out the db
  async.parallel([
      function(cb) { Doc.remove({}, cb); },
      function(cb) { User.remove({}, cb); }
  ], function(err, results) {
    if (err) return done(err);
    // load data into db
    async.parallel([
        function(cb) { User.create(data.users[0], cb); },
        function(cb) { User.create(data.users[1], cb); },
        function(cb) { Doc.create(data.owned[0], cb); },
        function(cb) { Doc.create(data.owned[1], cb); },
        function(cb) { Doc.create(data.owned[2], cb); },
        function(cb) { Doc.create(data.unowned[0], cb); },
        function(cb) { Doc.create(data.unowned[1], cb); }
    ], done);
  });
});

// Returns an array of docs that are owned by the given user so that tests
// don't need to assume anything about the data. This also trims off fields
// that don't show up in the client response.
function docsFor(user) {
  if (!user)
    return data.unowned.slice();
  var result = [];
  for (var i in data.owned)
    if (data.owned[i].user === user._id)
      result.push({name:data.owned[i].name, body:data.owned[i].body});
  return result;
}

describe('docs', function() {
  describe('route /', function() {
    describe('GET', function() {
      it('should get all unowned docs when no user is given', function(done) {
        var expected = docsFor(null);
        supertest(simpleApp)
          .get('/').expect(200).expect('Content-Type', /json/)
          .set('Accept', 'text/html')      // should ignore Accept header
          .set('Content-Type', 'bullshit') // should ignore Content-Type header
          .end(function(err, res) {
            if (err) return done(err);
            // can't guarantee order
            res.body.should.be.an.Array.and.have.length(expected.length);
            for (var i in data.unowned)
              res.body.should.containEql(expected[i]);
            done();
          });
      });

      it('should get all the owned docs by a particular user', function(done) {
        var user = data.users[0],
            expected = docsFor(user),
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .get('/')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            // can't guarantee order
            res.body.should.be.an.Array.and.have.length(expected.length);
            for (var i in expected)
              res.body.should.containEql(expected[i]);
            done();
          });
      });
    }); // end describe GET

    describe('POST', function() {
      it('should save new unowned documents', function(done) {
        var names = ['new_guy', 'Test', '_', '-', '012345-6789', 0, -1];
        async.each(names, function(name, cb) {
          var req = { name: name, body: 'fortress' },
              expected = { name: name.toString(), body: req.body };
              // (toString() to cover number cases)
          supertest(simpleApp)
            .post('/')
            .set('Accept', 'nothing')  // should ignore Accept header
            .set('Content-Type', '')   // should ignore Content-Type header
            .send(req)
            .expect(201).expect('Content-Type', /json/) // 201 created
            .end(function(err, res) {
              if (err) return cb(err);
              res.body.should.eql(expected);
              Doc.find(req, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(1);
                cb();
              });
            });
        }, done);
      });

      it("should save a user's document", function(done) {
        var user = data.users[1],
            newDoc = { name: 'my_new_doc', body: 'stuff' },
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .post('/')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(newDoc).expect(201).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(newDoc);
            Doc.find({user:user._id}, function(err, docs) {
              if (err) return done(err);
              docs.should.have.length(docsFor(user).length+1);
              done();
            });
          });
      });

      it('should be able to post a dupe doc for diff user', function(done) {
        var user = data.users[0],
            dupe = docsFor(data.users[1])[0],
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .post('/')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(dupe).expect(201).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(dupe);
            Doc.find(dupe, function(err, docs) {
              if (err) return done(err);
              docs.should.have.length(2);
              done();
            });
          });
      });

      it('should not be able to post duplicate name', function(done) {
        var dupe = { name: data.unowned[1].name, body: 'already there' };
        supertest(simpleApp)
          .post('/')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(dupe).expect(409).expect('Content-Type', /json/) // 409 conflict
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.have.property('field', 'name');
            Doc.find({user:null}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(data.unowned.length);
              docs.should.not.containEql(dupe);
              done();
            });
          });
      });

      it('should not be able to post without name', function(done) {
        var req = { body:'only body, no name' };
        supertest(simpleApp)
          .post('/')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(req).expect(400).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.have.property('field', 'name');
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(data.unowned.length+data.owned.length);
              done();
            });
          });
      });

      it('should not be able to post invalid name', function(done) {
        var names = [ null, '', '\\', '\\"', 'has space', "I'mInvalid", 't%st',
        '♪tunes', '#hashtag', 'double"quotes', '\n'
        ];
        async.each(names, function(name, cb) {
          var req = {name: name, body: 'whatever'};
          supertest(simpleApp)
            .post('/')
            .set('Accept', 'nothing')  // should ignore Accept header
            .set('Content-Type', '')   // should ignore Content-Type header
            .send(req).expect(400).expect('Content-Type', /json/)
            .end(function(err, res) {
              if (err) return cb(err);
              res.body.should.be.an.Array.and.have.length(1);
              res.body[0].should.have.property('message');
              res.body[0].should.have.property('field', 'name');
              Doc.find({}, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(data.unowned.length+data.owned.length);
                cb();
              });
            });
        }, done);
      });

      it('should fail when posting invalid json', function(done) {
        var req = ' {} not json ';
        supertest(simpleApp)
          .post('/').set('Content-Type', 'application/json').send(req)
          .expect(400).expect('Content-Type', /json/) // 400 bad request
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(data.unowned.length+data.owned.length);
              done();
            });
          });
      });

      it('should fail when posting no json', function(done) {
        supertest(simpleApp)
          .post('/')
          .expect(400).expect('Content-Type', /json/) // 400 bad request
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(data.unowned.length+data.owned.length);
              done();
            });
          });
      });
    }); // end describe POST

    describe('DELETE', function() {
      it('should not be able to delete', function(done) {
        supertest(simpleApp)
          .del('/')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect('Content-Type', /json/).expect(405) // 405 method not allowed
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(data.unowned.length+data.owned.length);
              done();
            });
          });
      });
    }); // end describe DELETE

    describe('PUT', function() {
      it('should not be able to put', function(done) {
        supertest(simpleApp)
          .put('/')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect('Content-Type', /json/).expect(405) // 405 method not allowed
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(data.unowned.length+data.owned.length);
              done();
            });
          });
      });
    }); // end describe PUT
  }); // end describe route /

  describe('route /:name', function() {
    describe('GET', function() {
      it('should get the named unowned doc', function(done) {
        var doc = data.unowned[0];
        supertest(simpleApp)
          .get('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql({name:doc.name, body:doc.body});
            done();
          });
      });

      it('should get the named owned doc', function(done) {
        var user = data.users[0],
            doc = docsFor(user)[0],
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .get('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(doc);
            done();
          });
      });

      it('should not be able to get doc owned by other user', function(done) {
        var user = data.users[0],
            doc = docsFor(data.users[1])[0],
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .get('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(404).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            done();
          });
      });

      it("should fail if :name doesn't exist", function(done) {
        var doc = { name: 'not_there', body: 'ghost' };
        supertest(simpleApp)
          .get('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(404).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            done();
          });
      });
    }); // end describe GET

    describe('POST', function() {
      it('should not be able to post to new or existing', function(done) {
        var names = [ 'new-name', data.unowned[1].name ];
        async.each(names, function(name, cb) {
          var req = {name: name, body: 'whatever'};
          supertest(simpleApp)
            .post('/' + req.name)
            .set('Accept', 'nothing')  // should ignore Accept header
            .set('Content-Type', '')   // should ignore Content-Type header
            .send(req)
            .expect(405).expect('Content-Type', /json/)// 405 method not allowed
            .end(function(err, res) {
              if (err) return cb(err);
              res.body.should.be.an.Array.and.have.length(1);
              res.body[0].should.have.property('message');
              res.body[0].should.not.have.property('field');
              Doc.find({}, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(data.unowned.length+data.owned.length);
                cb();
              });
            });
        }, done);
      });
    }); // end describe POST

    describe('PUT', function() {
      it('should update existing unowned doc by :name', function(done) {
        var req = { name: data.unowned[0].name, body: 'new body' };
        supertest(simpleApp)
          .put('/' + req.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(req)
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(req);
            Doc.find({name: req.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              docs[0].should.have.properties(req);
              done();
            });
          });
      });

      it('should update existing owned doc by :name', function(done) {
        var user = data.users[1],
            doc = docsFor(user)[0],
            app = express();
        doc.body = 'new bod';
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .put('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(doc)
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(doc);
            Doc.find({name: doc.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              docs[0].should.have.properties(doc);
              done();
            });
          });
      });

      it('should respond OK even if nothing was changed', function(done) {
        var doc = data.unowned[0];
        supertest(simpleApp)
          .put('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(doc)
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(doc);
            Doc.find({name: doc.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              docs[0].should.have.properties(doc);
              done();
            });
          });
      });

      it("should fail if :name doesn't exist", function(done) {
        var req = { name: 'nonExistant', body: 'whatever' };
        supertest(simpleApp)
          .put('/' + req.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(req)
          .expect(404).expect('Content-Type', /json/) // 404 not found
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find({name: req.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.be.empty;
              done();
            });
          });
      });

      it('should not be able to rename to existing name', function(done) {
        var existing = data.unowned[0],
            req = { name: data.unowned[1].name, body: 'whatever' };
        supertest(simpleApp)
          .put('/' + existing.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(req)
          .expect(409)  // conflict
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.have.property('field', 'name');
            Doc.find({name: existing.name}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              docs[0].should.have.property('body', existing.body);
              Doc.find({name: data.unowned[1].name}, function(err, docs) {
                if (err) return done(err);
                docs.length.should.equal(1);
                docs[0].should.have.property('body', data.unowned[1].body);
                done();
              });
            });
          });
      });

      it('should be able to update to dupe name of diff user', function(done) {
        var user = data.users[1],
            dupe = docsFor(data.users[0])[0],
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .put('/'+docsFor(user)[0].name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(dupe)
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(dupe);
            Doc.find(dupe, function(err, docs) {
              if (err) return done(err);
              docs.should.have.length(2);
              done();
            });
          });
      });

      it("should fail if trying to update someone else's doc", function(done) {
        var user = data.users[1],
            doc = docsFor(data.users[0])[0],
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .put('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .send(doc)
          .expect(404).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find(doc, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              docs[0].should.have.property('user', data.users[0]._id);
              done();
            });
          });
      });

      it('should not be able to set invalid name', function(done) {
        var doc = data.unowned[1],
            names = [ null, '', '\\', '\\"', 'has space', "I'mInvalid", 't%st',
                     '♪tunes', '#hashtag', 'double"quotes', '\n' ];
        async.each(names, function(name, cb) {
          var req = {name: name, body: 'whatever'};
          supertest(simpleApp)
            .put('/' + doc.name)
            .set('Accept', 'nothing')  // should ignore Accept header
            .set('Content-Type', '')   // should ignore Content-Type header
            .send(req)
            .expect(400) // bad request
            .expect('Content-Type', /json/)
            .end(function(err, res) {
              if (err) return cb(err);
              res.body.should.be.an.Array.and.have.length(1);
              res.body[0].should.have.property('message');
              res.body[0].should.have.property('field', 'name');
              Doc.find(doc, function(err, docs) {
                if (err) return cb(err);
                docs.length.should.equal(1);
                cb();
              });
            });
        }, done);
      });

      it('should fail when putting invalid json', function(done) {
        var req = 'no json here {}',
            doc = data.unowned[0];
        supertest(simpleApp)
          .put('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', 'application/json')
          .send(req)
          .expect(400).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find(doc, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(1);
              done();
            });
          });
      });

      it('should fail when putting no json', function(done) {
        var req = data.unowned[0];
        supertest(simpleApp)
          .put('/'+req.name)
          .expect(400).expect('Content-Type', /json/) // 400 bad request
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            Doc.find(req, function(err, docs) {
              if (err) return done(err);
              docs.should.have.length(1);
              docs[0].should.have.properties(req);
              done();
            });
          });
      });
    }); // end describe PUT

    describe('DELETE', function() {
      it('should delete the unowned doc by :name', function(done) {
        var doc = data.unowned[1];
        supertest(simpleApp)
          .del('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(200).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.eql(doc);
            Doc.find(doc, function(err, docs) {
              if (err) return done(err);
              docs.length.should.be.empty;
              done();
            });
          });
      });

      it("should not be able to delete someone else's doc", function(done) {
        var user = data.users[0],
            doc = docsFor(data.users[1])[0],
            app = express();
        // simulate middleware adding basic auth user
        app.use(function(req, res, next) {
          req.user = { name: user.name, _id: user._id };
          next();
        }, docs);
        supertest(app)
          .del('/' + doc.name)
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(404).expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find({user:user}, function(err, docs) {
              if (err) return done(err);
              docs.should.have.length(docsFor(user).length);
              done();
            });
          });
      });

      it("should not delete if :name doesn't exist", function(done) {
        supertest(simpleApp)
          .del('/absent')
          .set('Accept', 'nothing')  // should ignore Accept header
          .set('Content-Type', '')   // should ignore Content-Type header
          .expect(404)
          .expect('Content-Type', /json/)
          .end(function(err, res) {
            if (err) return done(err);
            res.body.should.be.an.Array.and.have.length(1);
            res.body[0].should.have.property('message');
            res.body[0].should.not.have.property('field');
            Doc.find({}, function(err, docs) {
              if (err) return done(err);
              docs.length.should.equal(data.unowned.length+data.owned.length);
              done();
            });
          });
      });

    }); // end describe DELETE
  }); // end describe route /:name
}); // end describe docs
