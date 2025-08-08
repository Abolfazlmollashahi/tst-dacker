const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");
const router = express.Router();

// read notif
router.post("/mark-as-read/:id", authMiddleware, async (req, res) => {
 try {
  const notificationId = req.params.id;

  // فقط کاربر گیرنده میتواند این عملیات را انجام دهد
  const notification = await Notification.findById(notificationId);
  if (!notification) {
   return res.status(404).json({ message: "نوتیفیکیشن یافت نشد" });
  }

  if (notification.receiver.toString() !== req.user._id.toString()) {
   return res.status(403).json({ message: "دسترسی نامعتبر" });
  }

  // علامتگذاری به عنوان خوانده شده
  notification.read = true;
  await notification.save();

  res.json({ message: "نوتیفیکیشن خوانده شده شد" });
 } catch (error) {
  res.status(500).json({ message: "خطای سرور" });
 }
});

// get notif
router.get('/user-notifications', authMiddleware, async (req, res) => {
    try {
      const notifications = await Notification.find({ receiver: req.user._id })
        .populate('sender', 'username profilePic')
        .sort({ createdAt: -1 });
  
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: 'خطای سرور' });
    }
  });

module.exports = router;
