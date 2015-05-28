var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  name: {
    type: String,
    required: "Name is required.",
    unique: true
  },
  password: {
    type: String,
    required: "Password is required.",
  }
});

var User = mongoose.model('User', userSchema);

module.exports = User;
