// Unit tests for conf-builder.js tool
// Note that this doesn't cover every setting in the conf, just some of the
// non-trivial ones. It may not be complete but it's better than no tests.

var should = require('should'),
    builder = require('../tools/conf-builder'),
    path = require('path'),
    root = path.join(__dirname, '..');

describe('conf-builder', function() {

  describe('ports', function() {
    it('should set defaults', function(done) {
      var defaults = { ports: { http:8080, https:8443 } };
      builder.build({}).should.have.properties(defaults);
      done();
    });
    it('should work with valid ports', function(done) {
      var conf = { ports: { http: 1234, https: 0 } },
          result = builder.build(conf);
      result.should.have.properties(conf);
      done();
    });
    it('should bitch about missing nested properties', function(done) {
      var bad = { ports: "I'm bad, I'm nationwide" };
      builder.build.bind(null, bad).should.throw();
      done();
    });
  });

  describe('paths', function() {
    it('should set defaults', function(done) {
      var defaults = {
        paths: {
          tlsKey: path.join(root, 'tls', 'dev.key.pem'),
          tlsCert: path.join(root, 'tls', 'dev.cert.pem'),
        }
      };
      builder.build({}).should.have.properties(defaults);
      done();
    });
    it('should leave abosulte paths', function(done) {
      var conf = { paths: { tlsKey:'/somewhere/key', tlsCert:'/tmp/cert'} },
          result = builder.build(conf);
      result.should.have.properties(conf);
      done();
    });
    it('should resolve relative paths', function(done) {
      var conf = { paths: { tlsKey:'key', tlsCert:'cert'} },
          result = builder.build(conf),
          expected = {
            paths: {
              tlsKey: path.resolve(root, 'key'),
              tlsCert: path.resolve(root, 'cert')
            }
          };
      result.should.have.properties(expected);
      done();
    });
    it('should bitch about missing nested properties', function(done) {
      var bad = { paths: "I'm bad, I'm nationwide" };
      builder.build.bind(null, bad).should.throw();
      done();
    });
  });

  describe('serveIndex', function() {
    it('should set defaults', function(done) {
      var result = builder.build({});
      result.should.have.property('serveIndex');
      result.serveIndex.should.be.a.Array;
      result.serveIndex.should.have.length(1);
      result.serveIndex[0].should.eql({
        route: '/public',
        path: 'web/public',
        secure: false,
        options: { icons: true, view: 'details' }
      });
      done();
    });
    it("should bitch if paths are wrong", function(done) {
      var bad = { serveIndex: "I'm bad, I'm nationwide" };
      builder.build.bind(null, bad).should.throw();
      bad = { serveIndex: [ {options: true} ] };
      builder.build.bind(null, bad).should.throw();
      done();
    });
  });

});
