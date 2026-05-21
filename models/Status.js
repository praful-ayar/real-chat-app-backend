const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  media: { type: String, required: true },
  type: { type: String, enum: ['image', 'video', 'text'], default: 'image' },
  text: { type: String, default: '' },
  viewers: [{ type: String }], // Emails of users who viewed this status
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL Index: 86400 seconds = 24 hours
});

module.exports = mongoose.model("Status", statusSchema);
