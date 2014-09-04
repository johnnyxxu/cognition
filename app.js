var express = require('express'),
    serveIndex = require('serve-index'),
    path = require('path');

module.exports = function(conf) {

  var app = express();

  var pubDir = path.join(conf.cog_root, 'web', 'public');
  var resourceDir = path.join(conf.cog_root, 'web', 'resources');
  var routesDir = path.join(conf.cog_root, 'routes');

  app.use('/public', express.static(pubDir, {
    'dotfiles': 'allow'  // show hidden files
  }));
  app.use('/public', serveIndex(pubDir, {
    'icons': true,      // show icons
    'view': 'details',  // details view
    'hidden': true      // show hidden files
  }));

  app.use('/resources', express.static(resourceDir));

  app.use('/', require(path.join(routesDir, 'index'))(conf));
  app.use('/me', require(path.join(routesDir, 'me'))(conf));

  return app;
}
