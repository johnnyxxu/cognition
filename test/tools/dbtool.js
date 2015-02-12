// Tool for managing the db connection for unit tests.
// This uses the conf.json file in the test directory.
// See the README for what each setting does.

var mongoose = require('mongoose');

var confAt = require('path').join(__dirname, '..', 'conf.json'),
    conf = require(confAt);

conf.db = conf.db || 'mongodb://localhost/test';

function drop() { mongoose.connection.db.dropDatabase(); }

if (conf.useMockgoose)
  require('mockgoose')(mongoose);

module.exports = {
  open: function(done) {
    mongoose.connect(conf.db, function(err) {
      if (err)
        return done(err);
      if (conf.preDrop)
        drop();
      mongoose.connection.db.collectionNames(function(err, names) {
        if (err)
          return done(err);
        if (names.length != 0)
          return done(new Error(conf.db + ' is not empty.'));
        done();
      });
    });
  },

  close: function(done) {
    if (conf.postDrop)
      drop();
    mongoose.connection.close(done);
  },

  drop: function(done) { drop(); done(); }
}
