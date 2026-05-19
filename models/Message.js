const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  receiver: {
    type: String,
    default: null
  },
  replyTo: {
    type: String,
    default: null
  },
  replyToText: {
    type: String,
    default: null
  },
  replyToSender: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Message", messageSchema);