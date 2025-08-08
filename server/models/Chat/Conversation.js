
const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

// جلوگیری از ایجاد چند کانورزیشن بین دو نفر
ConversationSchema.index({ members: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", ConversationSchema);


// const mongoose = require("mongoose");

// const ConversationSchema = new mongoose.Schema(
//   {
//     members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
//     lastMessage: { type: String },
//     updatedAt: { type: Date, default: Date.now }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Conversation", ConversationSchema);