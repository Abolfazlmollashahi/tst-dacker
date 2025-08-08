const express = require("express");
const Ad = require("../models/Ad");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

const router = express.Router();

// دریافت همه تبلیغات
router.get("/", async (req, res) => {
 try {
  const ads = await Ad.find();
  // console.log("ads => " ,ads.length);
  
  res.json({ ads });
 } catch (err) {
  res.status(500).json({ message: "خطا در دریافت تبلیغات", error: err.message });
 }
});

// get ads nesxt 20 secend
router.get("/next/:index", async (req, res) => {
 try {
  const ads = await Ad.find(); // دریافت همه تبلیغات از دیتابیس
  const index = parseInt(req.params.index) || 0;

  if (ads.length === 0) {
   return res.status(404).json({ message: "هیچ تبلیغی یافت نشد!" });
  }

  const ad = ads[index % ads.length]; // نمایش تبلیغ بعدی (گردشی)
  res.json({ ad });
 } catch (err) {
  res.status(500).json({ message: "خطا در دریافت تبلیغ", error: err.message });
 }
});

// افزودن تبلیغ جدید
router.post("/",upload.single("file"), authMiddleware, async (req, res) => {

 try {
    if (!req.file) {
        return res.status(400).json({ message: "تصویری ارسال نشده است!" });
      }

      const { link, position } = req.body;

      const newAd = new Ad({
        file: `/uploads/images/${req.file.filename}`, // مسیر ذخیره شده
        link,
        position,
      });
  await newAd.save();
  res.status(201).json({ message: "تبلیغ با موفقیت اضافه شد!", ad: newAd });
 } catch (err) {
  res.status(500).json({ message: "خطا در افزودن تبلیغ", error: err.message });
 }
});

// حذف یک تبلیغ با آیدی
router.delete("/:id", async (req, res) => {
 try {
  await Ad.findByIdAndDelete(req.params.id);
  res.json({ message: "تبلیغ با موفقیت حذف شد!" });
 } catch (err) {
  res.status(500).json({ message: "خطا در حذف تبلیغ", error: err.message });
 }
});


// افزایش تعداد بازدید تبلیغ
router.post("/ad-view/:id", async (req, res) => {
  try {
    const id = req.params.id
    // console.log('id==',id);
    
    const ad = await Ad.findById(id);
    // console.log('addd = ',ad);
    
    if (!ad) {
      return res.status(404).json({ message: "تبلیغ یافت نشد!" });
    }
    
    ad.views += 1; 
    // console.log('ccccc',ad);
    
    await ad.save();

    res.json({ message: "بازدید ثبت شد!", views: ad.views });
  } catch (error) {
    res.status(500).json({ error: "خطا در ثبت بازدید!" });
  }
});

module.exports = router;
