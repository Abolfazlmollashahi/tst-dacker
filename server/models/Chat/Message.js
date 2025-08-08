const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
 {
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  file: {
   url: { type: String },
   name: { type: String },
   mimeType: { type: String },
   size: { type: Number },
  },
  pending: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
 },
 { timestamps: true }
);

module.exports = mongoose.model("Message", MessageSchema);
