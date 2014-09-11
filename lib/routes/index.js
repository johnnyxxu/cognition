var express = require('express'),
    path = require('path');

module.exports = function(conf){

  var router = express.Router();

  router.get('/', function(req, res) {
    res.sendFile(path.join(conf.paths.cog_root, 'web', 'index.html'));
  });

  return router;
}
