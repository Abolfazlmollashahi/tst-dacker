const express = require("express");
const Video = require("../models/Video");
const authMiddleware = require("../middleware/authMiddleware");
const { upload, checkVideoCopyright } = require("../middleware/uploadMiddleware");
const User = require("../models/User");
const wathVideo = require("../routes/wathvideoprice");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
const path = require("path");
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
const ffprobeInstaller = require("@ffprobe-installer/ffprobe");
ffmpeg.setFfprobePath(ffprobeInstaller.path);
// const { getVideoDurationInSeconds } = require('get-video-duration');


const router = express.Router();

// Upload video
router.post("/upload", upload.fields([{ name: "video" }, { name: "image" }]), authMiddleware, async (req, res) => {
 try {
  const { title, description, category } = req.body;

  if (!req.files.video || !req.files.image) {
   return res.status(400).json({ message: "اطلاعات تکمیل نیست!" });
  }

  if (req.files.video[0].size > 50 * 1024 * 1024) {
   return res.status(400).json({ message: "حجم ویدیو باید کم تر از 50 مگابایت باشد!" });
  }

  if (req.files.image[0].size > 5 * 1024 * 1024) {
   return res.status(400).json({ message: "حجم عکس باید کم تراز 5 مگابایت باشد!" });
  }

  const inputVideo = `uploads/videos/${req.files.video[0].filename}`;
  // const outputVideo = `uploads/videos/pro1_${req.files.video[0].filename}`;
  let logo = "uploads/images/logo.jpg";


  // ffmpeg.ffprobe(inputVideo, async (err, metadata) => {
  //  if (err) {
  //   console.error("❌ خطا در خواندن مدت زمان ویدیو:", err.message);
  //   return res.status(500).json({ message: "خطا در خواندن اطلاعات ویدیو" });
  //  }

  //  const duration = metadata.format.duration;

  //  ffmpeg(inputVideo)
  //   .input(logo)
  //   .complexFilter([`[1:v]scale=100:-1[logo]`, `[0:v][logo]overlay=10:10`])
  //   .output(outputVideo)
  //   .on("end", async () => {
  //    console.log("🎥 ویدیو با موفقیت پردازش شد!");

  //    const newVideo = new Video({
  //     title,
  //     description,
  //     videoUrl: outputVideo,
  //     imageUrl: `uploads/images/${req.files.image[0].filename}`,
  //     author: req.user.id,
  //     categories: category,
  //     duration: duration,
  //     size: req.files.video[0].size,
  //     totalprice: 100,
  //     finalPrice: 100,
  //    });

  //    await newVideo.save();

  //    await User.findByIdAndUpdate(req.user.id, {
  //     $push: { videos: newVideo._id },
  //    });

  //    let video = await Video.findById(newVideo._id)
  //    .populate("author", "username email profilePic")

  //    res.status(201).json({video:video, message: "تبریک ویدیو آپلود شد" });
  //   })
  //   .on("error", (err) => {
    //    console.error("❌ خطا در پردازش ویدیو:", err.message);
    //    res.status(500).json({ message: "خطا در پردازش ویدیو" });
    //   })
    //   .run();
    // });
    
       console.log("🎥 ویدیو با موفقیت پردازش شد!");
      //  const duration = await getVideoDurationInSeconds(inputVideo)

       const newVideo = new Video({
        title,
        description,
        videoUrl: inputVideo,
        imageUrl: `uploads/images/${req.files.image[0].filename}`,
        author: req.user.id,
        categories: category,
        // duration: duration,
        duration: 1000000,
        size: req.files.video[0].size,
        totalprice: 100,
        finalPrice: 100,
       });
  
       await newVideo.save();
  
       await User.findByIdAndUpdate(req.user.id, {
        $push: { videos: newVideo._id },
       });
  
       let video = await Video.findById(newVideo._id)
       .populate("author", "username email profilePic")
  
       res.status(201).json({video:video, message: "تبریک ویدیو آپلود شد" });
  } catch (err) {
    res.status(500).json({ message: "خطا در سمت سرور", error: err.message });
  }
});

// Get all videos
router.get("/allvideos", authMiddleware, async (req, res) => {
 try {
  const videos = await Video.find({ status: "confirmed" })
   .populate("author", "username email profilePic")
   .populate("views.user", "username email profilePic")
   .populate("comments.user", "username email profilePic");
  res.json(videos);
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});

// get videos user
router.get("/user", authMiddleware, async (req, res) => {
 try {
  const videos = await Video.find({ author: req.user.id })
   .populate("author", "username email profilePic")
   .populate("views.user", "username email profilePic")
   .populate("comments.user", "username email profilePic");

  res.json(videos);
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});

// get video
router.get("/video/:id", authMiddleware, async (req, res) => {
 const { id } = req.params;

 try {
  const video = await Video.findOne({ _id: id })
   .populate("author", "username email profilePic")
   .populate("views.user", "username email profilePic")
   .populate("comments.user", "username email profilePic");

  //   get categoryvideos
  const categoryVideos = await Video.find({
   _id: { $ne: id },
   categories: { $in: video.categories[0] },
   status: "confirmed",
  })
   .populate("author", "username email profilePic")
   .populate("views.user", "username email profilePic")
   .populate("comments.user", "username email profilePic");

  res.json({ video, categoryVideos });
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});

// search video and users
router.get("/search", authMiddleware, async (req, res) => {
 try {
  const query = req.query.q;

  if (!query) {
   return res.status(400).json({ message: "لطفاً متن جستجو را وارد کنید" });
  }

  const users = await User.find({
   username: { $regex: new RegExp(query, "i") },
  });

  const videos = await Video.find({
   $or: [{ title: { $regex: new RegExp(query, "i") } }, { description: { $regex: new RegExp(query, "i") } }],
  })
   .populate("author", "username email profilePic")
   .populate("views.user", "username email profilePic")
   .populate("comments.user", "username email profilePic");

  const results = {
   users,
   videos,
  };

  res.json(results);
 } catch (error) {
  res.status(500).json({ message: error.message });
 }
});

// video watch
router.get("/:videoId/watch", authMiddleware, async (req, res) => {
 try {
  const { videoId } = req.params;
  const userId = req.user.id;
  //   console.log(videoId, userId);

  let vid = await wathVideo(userId, videoId, res);

  //   console.log(vid);

  // const video = await Video.findById(id);
  // if (!video) return res.status(404).json({ message: "ویدیو یافت نشد" });
  // // چک کن که کاربر قبلاً این ویدیو رو دیده یا نه
  // const alreadyViewed = video.views.some((view) => view.user.toString() === userId);
  // if (!alreadyViewed) {
  //   video.views.push({ user: userId });
  //   await video.save();
  // }

  res.json({ views: vid, message: "مشاهده ثبت شد" });
 } catch (error) {
  res.status(500).json({ message: error });
 }
});

// add video to favorates
router.post("/favorites/add", authMiddleware, async (req, res) => {
 try {
  const { videoId } = req.body;
  const userId = req.user.id;

  const video = await Video.findById(videoId);
  if (!video) return res.status(404).json({ message: "ویدیو یافت نشد" });

  const user = await User.findById(userId);
  if (user.favorites.includes(videoId)) {
   return res.status(400).json({ message: "این ویدیو قبلاً اضافه شده است" });
  }

  user.favorites.push(videoId);
  await user.save();

  res.status(200).json({ message: "ویدیو به لیست علاقه‌مندی‌ها اضافه شد", video });
 } catch (error) {
  res.status(500).json({ message: "خطای سرور", error });
 }
});

// del video favorite
router.post("/favorites/remove", authMiddleware, async (req, res) => {
 try {
  const { videoId } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  user.favorites = user.favorites.filter((vid) => vid.toString() !== videoId);

  await user.save();

  res.status(200).json({ message: "ویدیو از لیست علاقه‌مندی‌ها حذف شد" });
 } catch (error) {
  res.status(500).json({ message: "خطای سرور", error });
 }
});

// get videos favorite
router.get("/favorites", authMiddleware, async (req, res) => {
 try {
  const userId = req.user.id;
  const user = await User.findById(userId).populate({
   path: "favorites",
   populate: {
    path: "author",
    select: "username profilePic email",
   },
  });

  res.status(200).json({ favorites: user.favorites });
 } catch (error) {
  res.status(500).json({ message: "خطای سرور", error });
 }
});


////////////
// api dashboard user

// edit video
router.put("/editvideo/:id", authMiddleware, async (req, res) => {
  try {
    const videoId = req.params.id;
    const { title, description } = req.body;

    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      { title, description },
      { new: true } // تا مقدار آپدیت‌شده برگرده
    );

    if (!updatedVideo) {
      return res.status(404).json({ message: "ویدیو پیدا نشد" });
    }

    res.status(200).json({ message: "ویرایش با موفقیت انجام شد", video: updatedVideo });
  } catch (error) {
    console.error("خطا در ویرایش ویدیو:", error);
    res.status(500).json({ message: "مشکلی در سرور پیش آمد" });
  }
});

// del video
router.post("/delvideo", authMiddleware, async (req, res) => {
  try {
   const {id} = req.body;
   await Video.findByIdAndDelete(id)
    
   res.status(200).json({ message: "ویدیو از لیست حذف شد" });
  } catch (error) {
   res.status(500).json({ message: "خطای سرور", error });
  }
 });
 
////////////























////////////////////////
// api dashbord admin //

// get all video
router.get("/allvideodashbord", authMiddleware, async (req, res) => {
 try {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const videos = await Video.find()
   .skip(skip)
   .limit(limit)
   .populate("author", "username email profilePic")
   .populate("views.user", "username email profilePic")
   .populate("comments.user", "username email profilePic");
  const allvideos = await Video.find()
   .populate("author", "username email profilePic")
   .populate("views.user", "username email profilePic")
   .populate("comments.user", "username email profilePic");

  res.json({ videos, allvideos });
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});

//change status video
router.post("/change/:videoid", authMiddleware, async (req, res) => {
 try {
  const { videoid } = req.params;
  const { newStatus } = req.body;
  //   console.log(videoid, newStatus);

  await Video.findByIdAndUpdate(videoid, {
   $set: { status: newStatus },
  });

  res.json({ message: "Video changed successfully" });
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});

// video delete
router.delete("/delete/video/:id", authMiddleware, async (req, res) => {
 try {
  const { id } = req.params;
  //   console.log(id);

  const video = await Video.findByIdAndDelete(id);
  res.json(video);
 } catch (error) {
  res.status(500).json({ message: error });
 }
});

module.exports = router;
