const { mongoose } = require("mongoose");
const SiteFinance = require("../models/SiteFinance");
const User = require("../models/User");
const Video = require("../models/Video");

const watchVideo = async (userId, videoId, res) => {
 try {
  const video = await Video.findById(videoId).populate("author");
  if (!video) throw new Error("ویدیو یافت نشد");

  const uploader = video.author; // صاحب ویدیو
  const viewer = await User.findById(userId);
  if (!viewer) throw new Error("کاربر یافت نشد");

  // چک کن که یوزر قبلاً این ویدیو رو دیده یا نه
  // const hasWatched = video.views?.some((v) => v.user.toString() === userId) || false;
  // if (hasWatched) return res.status(400).json({ message: "شما قبلا این ویدیو را دیده اید" });
  // console.log("video.views", video.views);

  const price = video.finalPrice; // قیمت ویدیو

  // درصدها
  const siteShare = (60 / 100) * price;
  const uploaderShare = (30 / 100) * price;
  const viewerShare = (10 / 100) * price;

  // دریافت اطلاعات مالی سایت
  let siteFinance = await SiteFinance.findOne();
  if (!siteFinance) {
   siteFinance = new SiteFinance({ totalRevenue: 0, transactions: [] });
   await siteFinance.save();
  }

  // بروزرسانی موجودی‌ها
  await User.updateOne(
   { _id: uploader._id },
   {
    $inc: { balance: uploaderShare },
    $push: {
     transactions: {
      type: "credit",
      amount: uploaderShare,
      description: `درآمد از ویدیو ${video.title}`,
     },
    },
   }
  );

  await User.updateOne(
   { _id: viewer._id },
   {
    $inc: { balance: viewerShare },
    $push: {
     transactions: {
      type: "credit",
      amount: viewerShare,
      description: `پاداش تماشای ویدیو ${video.title}`,
     },
    },
    $set: { lastActivity: new Date() },
   }
  );

  await SiteFinance.updateOne(
   {},
   {
    $inc: { totalRevenue: siteShare },
    $push: {
     transactions: {
      type: "credit",
      amount: siteShare,
      description: `درآمد سایت از تماشای ویدیو ${video.title}`,
     },
    },
   },
   { upsert: true }
  );

  console.log(`درآمد تقسیم شد: سایت ${siteShare}، آپلودکننده ${uploaderShare}، بیننده ${viewerShare}`);
  // ثبت بازدید در ویدیو
  await Video.updateOne(
   { _id: videoId },
   {
    $push: { views: { user: userId, watchedAt: new Date() } },
   }
  );
  
  let upvideo = await Video.findById(videoId)
  
  return upvideo.views;
 } catch (error) {
  console.error("خطا در پردازش پرداخت:", error);
  throw error;
 }
};

module.exports = watchVideo;
