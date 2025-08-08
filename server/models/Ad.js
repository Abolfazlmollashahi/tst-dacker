const mongoose = require("mongoose");

const AdSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    link: { type: String, required: true },
    position: { type: String, enum: ["top", "bottom", "center","left","video"], default: "bottom" },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ad", AdSchema);