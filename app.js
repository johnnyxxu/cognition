module.exports = function(conf) {

  var express = require('express'),
      path = require('path'),
      mongoose = require('mongoose'),
      serveIndex = require('serve-index'),
      favicon = require('serve-favicon'),
      mkdirp = require('mkdirp'),
      secure = require('./middleware/secure'),
      errHandler = require('./middleware/err-handler'),
      apiRouter = express.Router(),
      app = express();

  app.set('conf', conf);
  app.set('x-powered-by', false); // don't send "X-Powered-By: Express" header

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

    // mount /api
    app.use('/api', apiRouter);
    apiRouter.use(secure.https, secure.auth);
    apiRouter.route('/').all(function(req, res, next) {
      res.status(404);
      return next(new Error("Nothing here."));
    });
    apiRouter.use('/docs', require('./routes/docs'));
    apiRouter.use(errHandler);

  });

  return app;
}
