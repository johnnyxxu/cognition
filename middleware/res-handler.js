// ***************************************************
// *Deprecated* (for now) - previously, the client response included the method
// that was used in the request, the status code name, and an errors object.
// I've decided to deprecate this because it includes redundant information:
// the client should know what method they used in the request and the status
// is included in the response headers.
//
// This middleware was also going to be used to send a different type of
// response based on the Accepts header; e.g., if the client requested the API
// route but Accepted html, we should respond with HTML. Well, I've decided
// that html pages should just be at different routes and we can ignore the
// Accept header (beggars can't be choosers they say).
//
// Before this was deprecated, the pattern was that preceding middleware would
// set 'payload' and 'errors' properties on the res and this middleware would
// be in charge of forming those into a client response. I still like that
// pattern because it relieves each API from having to worry about what exactly
// is sent to the client and in what format. If I find a good reason to do that
// again I may resurrect this file but for now I'd like to just keep things
// simple.
// ***************************************************
//
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
