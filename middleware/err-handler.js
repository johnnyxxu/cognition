// Returns a middleware function for handling errors.
// When an error is received, it will set the status code on the response
// and add an 'errors' array to the response, which contains error objects
// with messages to be displayed to the client.
// This middleware should be use()d before the response handler so that the
// response sent to the client contains the error information.

// Use like:
//   var errHandler = require('.../err-handler');
//   ...
//   app.use(errHandler);

var statuses = require('http').STATUS_CODES;

// sets status on the response and returns it
function setStatus(res, err) {
  if (res.statusCode && res.statusCode != 200)
    return res.status(res.statusCode);
  if (!err || !err.name)
    return res.status(500);
  if (err.name == 'ValidationError') {  // produced by mongoose validation
    for (var path in err.errors) {
      // as of now, mongoose-unique-validator doesn't allow custom type
      if (err.errors[path].type == 'user defined')
        return res.status(409); // conflict
    }
    return res.status(400);
  }
  if (err.body && err.status) // produced by body-parser
    return res.status(err.status);
  return res.status(500);
}

// sets errors on response and returns it
function setErrors(res, err) {
  //console.error(err.stack);
  res.errors = res.errors || [];
  if (!err) {
    res.errors.push({message: 'Something broke :('});
  } else if (err.name && err.name == 'ValidationError') {
    // produced by mongoose validation
    for (var path in err.errors)
      res.errors.push({message: err.errors[path].message});
  } else if (err.message) {
    res.errors.push({message: err.message});
  } else if (statuses[res.statusCode]) {
    res.errors.push({message: statuses[res.statusCode]});
  } else {
    res.errors.push({message: 'Something broke :('});
  }
  return res;
}

module.exports = function(err, req, res, next) {
  setErrors(setStatus(res, err), err);
  next();
}
