module.exports = function(conf) {

  var express = require('express'),
      path = require('path'),
      mongoose = require('mongoose'),
      serveIndex = require('serve-index'),
      favicon = require('serve-favicon'),
      mkdirp = require('mkdirp'),
      secure = require('./middleware/secure'),
      errHandler = require('./middleware/err-handler'),
      resHandler = require('./middleware/res-handler'),
      app = express();

  app.set('conf', conf);

  mongoose.connect(conf.db, function(err) {

    app.use('/', favicon(path.join(__dirname, 'web', 'resources', 'cog.ico')));
    app.use('/', express.static(path.join(__dirname, 'web')));

    // mount serveIndex
    var i,s;
    for (i in conf.serveIndex) {
      s = conf.serveIndex[i];
      // make the directory if needed
      mkdirp(s.path, function(err, made) {
        if (err)
          console.error(err);
        if (made)
          console.log('created dir ' + made);
      });
      if (s.secure)
        app.use(s.route, secure.https, secure.auth);
      app.use(s.route, serveIndex(s.path, s.options));
    }

    app.use('/docs', secure.https, secure.auth, require('./routes/docs'));

    app.use(errHandler, resHandler);
  });

  return app;
}
