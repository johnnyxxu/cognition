// Includes various middleware functions to validate the incoming request.
// Usage:
//   var reqValidator = require('.../req-validator');
//   ...
//   app.use(reqValidator.allowAccept(...));
//   app.use('/some/route', reqValidator.allowMethods(...));

var statuses = require('http').STATUS_CODES;

// Returns middleware that validates the method used by a request.
// When an invalid method is used in the request, next(Error) will be called.
// Arguments should be an array of methods; e.g. allowMethods(['GET', 'POST'])
exports.allowMethods = function(methods) {
  return function(req, res, next) {
    if (methods.indexOf(req.method) === -1) {
      res.status(405); // method not allowed
      return next(new Error('This route allows methods ' + methods + '.'));
    }
    next();
  }
}

// Returns middleware that validates the Accept header of the request.
// When an invalid Accept is used in the request, next(Error) will be called.
// The arguments to this method match those of req.accepts, although you
// should pass 'application/json' rather than just 'json', for example, because
// these will be used to construct the error message sent to the client and we
// should be specific.
exports.allowAccept = function() {
  var types = arguments;
  return function(req, res, next) {
    if (!req.accepts.apply(req, types)) {
      res.status(406); // not acceptable
      var msg = 'You should accept ' + [].slice.call(types) + '.';
      return next(new Error(msg));
    }
    next();
  }
}

// Returns middleware that validates the Content-Type header used by a request.
// When an invalid type is used by the request, next(Error) will be called.
// Validation will pass if there is no request body or no Content-Type header.
// Arguments should be an array of types; e.g.
// allowContent(['application/json', 'text/html'])
// You should pass 'application/json' rather than just 'json', for example,
// because these will be used to construct the error message sent to the
// client and we should be specific.
exports.allowContent = function(types) {
  return function(req, res, next) {
    var conType = req.get('Content-Type'), is;
    if (!conType)  // no Content-Type header given in request
      return next();
    for (var i in types) {
      is = req.is(types[i]);
      // req.is will return null if there is no request body
      if (is == null || is)
        return next();
    }
    res.status(415); // unsupported media type
    var msg = 'Received Content-Type ' + conType
      + ' but I can only read ' + types + '.';
    next(new Error(msg));
  }
}
