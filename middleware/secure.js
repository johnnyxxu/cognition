// Returns an object with middleware functions
//   * https() - redirect your route to https
//   * auth()  - authenticate your route using basic auths defined in conf

// Usage:
//   var secure = require('.../secure');
//   ...
//   app.use(secure.https);
//   app.use('/whatever', secure.auth);
//   // you might often want to use both:
//   app.use('/secretplace', secure.https, secure.auth);


var bcrypt = require('bcrypt');

function forbid(conf, res) {
  var realm = conf.authRealm;
  res.status(401).setHeader('WWW-Authenticate', 'Basic realm="'+realm+'"');
}

function checkCreds(conf, incoming) {
  var ok = false;
  conf.auths.forEach(function(auth){
    if (bcrypt.compareSync(incoming, auth)){
      ok = true;
    }
  });
  return ok;
}

exports.https = function(req, res, next) {
  if (!req.secure)
    res.redirect('https://' + req.hostname + req.originalUrl);
  else
    next();
}

exports.auth = function(req, res, next) {
  var auth = req.headers.authorization;
  if (!auth) {
    forbid(req.app.conf, res);
    return next(new Error());
  } else {
    var encoded = auth.split(' ')[1];
    if (!checkCreds(req.app.conf, encoded)){
      var decoded = new Buffer(encoded, 'base64').toString();
      console.log('Received bad creds: ' + decoded);
      forbid(req.app.conf, res);
      return next(new Error());
    }
  }
  next();
}
