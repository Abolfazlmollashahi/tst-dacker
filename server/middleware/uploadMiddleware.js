const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const VideoHashSchema = require("../models/VideoHashSchema");

// تنظیمات ذخیره‌سازی
const storage = multer.diskStorage({
 destination: (req, file, cb) => {
  
  if (file.mimetype.startsWith("image")) {
    cb(null, "uploads/images/"); // پوشه مخصوص تصاویر
  } else if (file.mimetype.startsWith("video")) {
    cb(null, "uploads/videos/"); // پوشه مخصوص ویدیوها
  } else {
    cb(new Error("Unsupported file type!"), false); // اگر نوع فایل پشتیبانی نشود
  }
 },
 filename: (req, file, cb) => {
  cb(null, Date.now() + path.extname(file.originalname)); // نام فایل با زمان فعلی
 },
});

// فیلتر نوع فایل
const fileFilter = (req, file, cb) => {
 const allowedTypes = ["image/jpeg", "image/png","image/jpg","image/gif","image/webp", "video/mp4", "video/mkv"];
 if (allowedTypes.includes(file.mimetype)) {
  cb(null, true);
 } else {
  cb(new Error("Unsupported file type!"), false);
 }
};

// ایجاد middleware Multer
const upload = multer({
 storage,
 fileFilter,
});

// تابع هش کردن ویدیو
const getVideoHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
};

// Middleware برای بررسی کپی‌رایت
const checkVideoCopyright = async (req, res, next) => {

  try {
    if (!req.files.video) return res.status(400).json({ message: "فایلی آپلود نشده است!" });
    
    const filePath = req.files.video[0].path;

    const hash = await getVideoHash(filePath);

    // بررسی هش در دیتابیس
    const existingVideo = await VideoHashSchema.findOne({ hash });
    if (existingVideo) {
      fs.unlinkSync(filePath); // حذف ویدیو از سرور
      return res.status(403).json({ message: "این ویدیو قبلاً آپلود شده و دارای کپی‌رایت است!" });
    }

    // ذخیره هش در دیتابیس
    await new VideoHashSchema({ hash }).save();
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = { upload, checkVideoCopyright };
