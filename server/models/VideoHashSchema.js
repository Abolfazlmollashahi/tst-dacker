const mongoose = require("mongoose");

const VideoHashSchema = new mongoose.Schema({
  hash: { type: String, unique: true, required: true },
});

module.exports = mongoose.model("VideoHash", VideoHashSchema);