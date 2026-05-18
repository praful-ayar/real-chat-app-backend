const mongoose = require("mongoose");

const gifSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Gif", gifSchema);