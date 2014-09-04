var express = require('express'),
    bcrypt = require('bcrypt'),
    path = require('path');


module.exports = function(conf){

  // incoming: the encoded creds of the current request
  // creds: the authorized creds from the conf
  function checkCreds(incoming, creds) {
    var ok = false;
    creds.forEach(function(auth){
      if (bcrypt.compareSync(incoming, auth)){
        ok = true;
      }
    });
    return ok;
  }

  // what to do when forbidding access
  function forbid(res) {
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="My stuff"');
    res.sendFile(path.join(conf.cog_root, 'web', 'forbidden.html'));
  }


  var router = express.Router();

  // redirect to https
  router.use(function(req, res, next){
    if (!req.secure) {
      res.redirect('https://' + req.get('host') + req.originalUrl);
    } else {
      next();
    }
  });

  // use basic auth
  router.use(function(req, res, next){
    var auth = req.headers.authorization;
    if (!auth){
      forbid(res);
    } else {
      var encoded = auth.split(' ')[1];
      if (checkCreds(encoded, conf.basic_auths)){
        next();
      } else {
        var decoded = new Buffer(encoded, 'base64').toString();
        console.log('Received bad creds: ' + decoded);
        forbid(res);
      }
    }
  });

  // get
  router.get('/', function(req, res){
    res.sendFile(path.join(conf.cog_root, 'web', 'index.html'));
  });

  return router;
}
