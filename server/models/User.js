const mongoose = require("mongoose");
const { array } = require("../middleware/uploadMiddleware");

const UserSchema = new mongoose.Schema({
 username: { type: String,default:"" },
 email: { type: String, required: true, unique: true },
 password: { type: String, required: true ,select: false },
 createdAt: { type: Date, default: Date.now },
 lastLogin: { type: Date },
 lastActivity: { type: Date, default: Date.now },
 role: {
  type: String,
  enum: ["user", "admin", "adminAll"],
  default: "user",
 },
 usertype: {
  type: String,
  enum: ["regular", "premium"],
  default: "regular"
 },
 userlevel: { type: Number, min: 1, max: 5, default: 1 },
 profilePic: { type: [String], default: "" },
 baneruser: { type: String, default: "" },
 bio: { type: String, maxlength: 300 },
 videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
 favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }],
 followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User"}],
 following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
 isDeleted: { type: Boolean, default: false },
 deletedAt: { type: Date },
 balance: { type: Number, default: 0 },
 currencytransaction: [
  { type: mongoose.Schema.Types.ObjectId, ref: "Currencytransaction" }, // ارجاع به تراکنش‌های ارز
],
 status: { type: String, enum: ["active", "suspended", "banned", "pending"], default: "active" },
 isEmailVerified: { type: Boolean, default: false },
 emailVerificationToken: { type: String },
 loginHistory: [
  {
   ip: String,
   device: String,
   date: { type: Date, default: Date.now },
  },
 ],
 score: { type: Number, default: 0 },
 twoFactorEnabled: { type: Boolean, default: false },
 twoFactorSecret: { type: String },
 premiumExpiresAt: { type: Date },
 referralCode: {type:String,default : ''},
 referredBy: {type:String,default : ''},
 referredUsers:{type:Array, default : []}
});

module.exports = mongoose.model("User", UserSchema);