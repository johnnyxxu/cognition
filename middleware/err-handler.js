// Returns a middleware function for handling errors.
// When an error is received, it will set the status code on the response
// and send an array of json error objects, each with a message prop and
// possibly a field prop.

// Use like:
//   var errHandler = require('.../err-handler');
//   ...
//   app.use(errHandler);

var statuses = require('http').STATUS_CODES;

// sets status on the response and returns it
function setStatus(res, err) {
  if (res.statusCode && res.statusCode != 200)
    return res.status(res.statusCode);

  else if (!err || !err.name)
    return res.status(500);

  else if (err.name === 'ValidationError')  // produced by mongoose validation
    return res.status(400);

  else if (err.name === 'MongoError' && err.code === 11000) // unique constr
    return res.status(409); //conflict

  else if (err.body && err.status) // produced by body-parser
    return res.status(err.status);

  else
    return res.status(500);
}

// returns an array of errors to be sent to the client
function getErrors(res, err) {
  //console.error(err.stack);
  var result = [],
      internalError = { message: 'Something broke :(' };

  if (!err) {
    result.push(internalError);

  } else if (err.name === 'ValidationError') {
    // produced by mongoose validation
    for (var path in err.errors) {
      result.push({
        message: err.errors[path].message,
        field: err.errors[path].path
      });
    }

  } else if (err.name === 'MongoError' && err.code === 11000) {
    var errResponse = { message: err.message };
    if (err.field)
      errResponse.field = err.field;
    result.push(errResponse);

  } else if (err.message) {
    result.push({ message: err.message });

  } else if (statuses[res.statusCode]) {
    result.push({ message: statuses[res.statusCode] });

  } else {
    result.push(internalError);
  }

  return result;
}

module.exports = function(err, req, res, next) {
  res.json(getErrors(setStatus(res, err), err));
}
