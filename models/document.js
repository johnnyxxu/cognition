var mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator');

var docSchema = mongoose.Schema({
  name: {
    type: String,
    required: "'{PATH}' is required",
    unique: true,
    match: [
      /^[a-zA-Z0-9\-_]+$/,
      "'{PATH}' must contain only letters, numbers, dashes, and underscores"
    ]
  },
  content: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Use mongoose-unique-validator so we don't get E11000 mongo error.
// Also, we can specify error message with this module.
docSchema.plugin(uniqueValidator, {message:"'{PATH}' must be unique"});

var Doc = mongoose.model('Document', docSchema);

module.exports = Doc;
