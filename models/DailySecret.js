var mongoose = require("mongoose"),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var dailySecret = new Schema({
  secret: String,
  dateAdded: { type: Date, default: Date.now }
});

module.exports = mongoose.model("dailysecret", dailySecret);
