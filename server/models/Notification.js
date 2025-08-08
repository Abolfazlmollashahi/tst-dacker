const { default: mongoose } = require("mongoose");
const notificationSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });
  
  const Notification = mongoose.model('Notification', notificationSchema);
  module.exports = Notification;