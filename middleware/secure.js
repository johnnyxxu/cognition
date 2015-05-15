// Returns an object with middleware functions
//   * https() - redirect your route to https
//   * auth()  - authenticate requests to this route using basic auth

// Usage:
//   var secure = require('.../secure');
//   ...
//   app.use(secure.https);
//   app.use('/whatever', secure.auth);
//   // you might often want to use both:
//   app.use('/secretplace', secure.https, secure.auth);


var bcrypt = require('bcrypt'),
    auth = require('basic-auth'),
    User = require('../models/user');

function forbid(res) {
  var realm = res.app.get('conf').authRealm;
  res.status(401).setHeader('WWW-Authenticate', 'Basic realm="'+realm+'"');
}


exports.https = function(req, res, next) {
  if (!req.secure)
    res.redirect('https://' + req.hostname + req.originalUrl);
  else
    next();
}

exports.auth = function(req, res, next) {
  var creds = auth(req);

  if (!creds) {
    forbid(res);
    return next(new Error('invalid username:password'));
  }

  User.findOne({username:creds.name}, function(err, user) {
    if (err) {
      forbid(res);
      return next(err);
    } else if (!user) {
      forbid(res);
      return next(new Error("username '" + user + "' not found"));
    }

    bcrypt.compare(creds.pass, user.password, function(err, match) {
      if (err) {
        forbid(res);
        return next(err);
      } else if (!match) {
        forbid(res);
        return next(new Error("bad password '" + creds.pass + "'"));
      }
      next();
    });
  });
}
