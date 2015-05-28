// Router for docs API

var router = require('express').Router(),
    Doc = require('../models/document'),
    allowMethods = require('../middleware/req-validator').allowMethods,
    bodyParser = require('body-parser'),
    errHandler = require('../middleware/err-handler');

router.use(/^\/$/,   allowMethods(['GET', 'POST']));          // /
router.use(/^\/.+$/, allowMethods(['GET', 'PUT', 'DELETE'])); // /:name
router.use(bodyParser.json({type:'*/*'}));

// Returns an object with just a subset of properties from the mongoose db
// object. This is the object the client should see - properties like _id and
// __v should not exist in the response.
// It's usually better to use this rather than omitting those properties from
// the lookup like Doc.find({...}, '-_id -__v', ...) on an update such as POST
// since those properties need to exist when doing doc.save(...).
function toResponse(doc) {
  return {
    name: doc.name,
    body: doc.body
  };
}

router.route('/')
  // GET
  .get(function(req, res, next) {
    var criteria = (req.user) ? { user: req.user._id } : { user: null };
    // Use '-_id -__v...' instead of toResponse here since we need to select
    // multiple and we're not doing any updating anyway.
    Doc.find(criteria, '-_id -__v -user', function(err, docs) {
      if (err) return next(err);
      res.json(docs);
    });
  })
  // POST
  .post(function(req, res, next) {
    Doc.create({
      name: req.body.name,
      body: req.body.body,
      user: (req.user) ? req.user._id : null
    }, function(err, doc) {
      if (err) return next(err);
      res.status(201).json(toResponse(doc));
    });
  });

// Validate the :name route param and provide the doc to the route.
router.param('name', function(req, res, next, name) {
  var criteria = {
    name: name,
    user: (req.user) ? req.user._id : null
  }
  Doc.findOne(criteria, function(err, doc) {
    if (err) return next(err);
    if (!doc) {
      res.status(404);
      return next(new Error("Document '" + name + "' not found."));
    }
    req.doc = doc;
    next();
  });
});

router.route('/:name')
  // GET
  .get(function(req, res, next) {
    res.json(toResponse(req.doc));
  })
  // PUT
  .put(function(req, res, next) {
    req.doc.name = req.body.name;
    req.doc.body = req.body.body;
    req.doc.save(function(err, doc, nUpdated) {
      if (err) return next(err);
      // if nothing was changed, nUpdated will be 0; for now we don't care
      res.json(toResponse(doc));
    });
  })
  // DELETE
  .delete(function(req, res, next) {
    Doc.remove(req.doc, function(err) {
      if (err) return next(err);
      res.json(toResponse(req.doc));
    });
  });

// Error handling middleware.
router.use(function(err, req, res, next) {
  // We need this here so we can be specific about the name field in the error
  // response. AFAIK, we can't put this in the model because we have a compound
  // uniqueness among name and user.
  if (err.name === 'MongoError' && err.code === 11000) {
    err.message = "Name must be unique.";
    err.field = 'name';
  }
  next(err);
}, errHandler);

module.exports = router;
