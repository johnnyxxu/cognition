var mongoose = require('mongoose'),
    uniqueValidator = require('mongoose-unique-validator');

var userSchema = mongoose.Schema({
  username: {
    type: String,
    required: "'{PATH}' is required",
    unique: true
  },
  password: {
    type: String,
    required: "'{PATH}' is required",
  }
});

// Use mongoose-unique-validator so we don't get E11000 mongo error.
// Also, we can specify error message with this module.
userSchema.plugin(uniqueValidator, {message:"'{PATH}' must be unique"});

var User = mongoose.model('User', userSchema);

module.exports = User;
