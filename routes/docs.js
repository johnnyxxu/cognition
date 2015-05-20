// Router for docs API.

var router = require('express').Router(),
    Doc = require('../models/document'),
    validator = require('../middleware/req-validator'),
    bodyParser = require('body-parser'),
    errHandler = require('../middleware/err-handler'),
    resHandler = require('../middleware/res-handler');

router.use(/^\/$/, validator.allowMethods('GET', 'POST'));            // /
router.use(/^\/.+$/, validator.allowMethods('GET', 'PUT', 'DELETE')); // /:name
router.use(validator.allowContent('application/json'));
router.use(validator.allowAccept('application/json'));
router.use(bodyParser.json());

// Carves properties like _id and __v from db object since the user doesn't
// need to see these. It's better to use this rather than doing something
// like Doc.find({...}, '-_id -__v', ...) because the model needs to have
// those properties when doing an update.
function toResponse(doc) {
  return {
    name: doc.name,
    content: doc.content
  };
}

router.route('/')
  // GET
  .get(function(req, res, next) {
    var criteria = (req.user) ? { user: req.user.id } : { user: null };
    // Use '-_id -__v...' instead of toResponse here since we need to select
    // multiple and we're not doing any updating anyway.
    Doc.find(criteria, '-_id -__v -user', function(err, docs) {
      if (err)
        return next(err);
      res.payload = docs;
      next();
    });
  })
  // POST
  .post(function(req, res, next) {
    Doc.create({
      name: req.body.name,
      content: req.body.content,
      user: (req.user) ? req.user.id : null
    }, function(err, doc) {
      if (err)
        return next(err);
      res.status(201).payload = toResponse(doc);
      next();
    });
  });

// Validate the name route param and provide the doc to the route.
// Don't omit properties like _id because we may need to update the doc.
router.param('name', function(req, res, next, name) {
  var criteria = {
    name: name,
    user: (req.user) ? req.user.id : null
  }
  Doc.findOne(criteria, function(err, doc) {
    if (err)
      return next(err);
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
    res.payload = toResponse(req.doc);
    next();
  })
  // PUT
  .put(function(req, res, next) {
    req.doc.name = req.body.name;
    req.doc.content = req.body.content;
    req.doc.save(function(err, doc, nUpdated) {
      if (err)
        return next(err);
      if (nUpdated != 1)
        return next(new Error('Document not updated.'));
      res.payload = toResponse(doc);
      next();
    });
  })
  // DELETE
  .delete(function(req, res, next) {
    Doc.remove(req.doc, function(err) {
      if (err)
        return next(err);
      res.payload = toResponse(req.doc);
      next();
    });
  });

router.use(errHandler, resHandler);

module.exports = router;
