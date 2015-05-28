var mongoose = require('mongoose');

var docSchema = mongoose.Schema({
  name: {
    type: String,
    required: "Name is required.",
    match: [
      /^[a-zA-Z0-9\-_]+$/,
      "Name can contain only letters, numbers, dashes, and underscores."
    ]
  },
  body: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// the pair name+user must be unique
docSchema.index({ name: 1, user: 1 }, { unique: true });

var Doc = mongoose.model('Document', docSchema);

module.exports = Doc;
