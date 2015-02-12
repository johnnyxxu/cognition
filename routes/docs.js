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

// Strips _id and __v from db object so it can be sent as json response.
// Use this in /:name routes instead of using '-_id -__v' for Doc.find so
// the db object can be updated in POST or DELETE.
function clean(doc) {
  return {name: doc.name, content: doc.content};
}

router.route('/')
  // GET
  .get(function(req, res, next) {
    Doc.find({}, '-_id -__v', function(err, docs) {
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
      content: req.body.content
    }, function(err, doc) {
      if (err)
        return next(err);
      res.status(201).payload = clean(doc);
      next();
    });
  });

// Validate the name param and provide the doc to the route.
// Don't omit properties like _id because we may need to update the doc.
router.param('name', function(req, res, next, name) {
  Doc.findOne({ name: name }, function(err, doc) {
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
    res.payload = clean(req.doc);
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
      res.payload = clean(doc);
      next();
    });
  })
  // DELETE
  .delete(function(req, res, next) {
    Doc.remove(req.doc, function(err) {
      if (err)
        return next(err);
      res.payload = clean(req.doc);
      next();
    });
  });

router.use(errHandler, resHandler);

module.exports = router;
