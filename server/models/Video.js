const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema(
 {
  status: {
   type: String,
   enum: ["UnderReview", "rejected", "confirmed"],
   default: "UnderReview",
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  imageUrl: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  views: [
   {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    watchedAt: { type: Date, default: Date.now },
   },
  ],
  totalprice: { type: Number, default: 0 },
  finalPrice: { type: Number, default: 0 },
  currency: { type: String, default: "CFC" },
  isPublished: { type: Boolean, default: false },
  comments: [
   {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    commentText: { type: String },
    date: { type: Date, default: Date.now },
   },
  ],
  categories: [
   {
    type: String,
    required: true,
   },
  ],
  duration: { type: Number, required: true },
  size: { type: Number, required: true },
  // visibility: { type: String, enum: ["public", "private"], default: "public" },
  hideBanner: { type: Boolean, default: false }, 
  allowDownload: { type: Boolean, default: false },
  isTopRated: { type: Boolean, default: false },
 },
 { timestamps: true }
);

module.exports = mongoose.model("Video", VideoSchema);
