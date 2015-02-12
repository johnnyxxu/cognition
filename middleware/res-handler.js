// Middleware for sending a response to the client. You should use this
// instead of directly calling res.json(), res.send(), or similar.
// It should probably be use()d last, since sending the response is usually
// the last thing you do.

// Use like:
//   var resHandler = require('.../res-handler');
//   ...
//   app.use(resHandler);

var statuses = require('http').STATUS_CODES;

module.exports = function(req, res, next) {
  if (res.headersSent)
    return next();

  // always respond with json for now
  res.json({
    status: statuses[res.statusCode] || statuses[500],
    method: req.method,
    payload: res.payload || {},
    errors: res.errors || []
  });
  next();
}
