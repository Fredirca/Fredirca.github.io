var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var userScheme = new Schema({
  discordId: String,
  clientId: String,
  username: String,
  dateAdded: { type: Date, default: Date.now },
  nonce: { type: Number, default: 0 },
  bits: { type: Number, default: 0 }
});

module.exports = mongoose.model("users", userScheme);
