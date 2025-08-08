const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");
const Video = require("../models/Video");
const Conversation = require("../models/Chat/Conversation");
const Message = require("../models/Chat/Message");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
 const { email, password, referralCode } = req.body;
 try {
  // ساخت کد معرف یکتا
  const referralCodeGenerated = email.substring(0, 5).toUpperCase() + Math.floor(1000 + Math.random() * 9000);

  // چک کردن کد معرف و پیدا کردن معرف
  let referredByUser = null;
  if (referralCode) {
   referredByUser = await User.findOne({ referralCode });
   if (!referredByUser) return res.status(400).json({ message: "کد معرف نامعتبر است!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
   email,
   password: hashedPassword,
   referralCode: referralCodeGenerated,
   referredBy: referredByUser ? referredByUser.referralCode : null,
   balance: referredByUser ? 1000 : 500,
  });
  await user.save();

  if (referredByUser) {
   referredByUser.referredUsers.push(user._id);
   let referralBonus = 2000 + referredByUser.referredUsers.length * 500;
   referredByUser.balance += referralBonus;
   await referredByUser.save();
  }
  res.status(201).json({ message: "اکانت ساخته شد!" });
 } catch (err) {
  res.status(500).json({ message: err.message });
 }
});
// Login
router.post("/login", async (req, res) => {
 const { email, password } = req.body;

 try {
  const user = await User.findOne({ email }).select("+password");

  if (!user) return res.status(400).json({ message: "کاربر پیدا نشد!" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "رمز ورود اشتباه است!" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2d" });
  // const userr = await User.findById(user._id).populate(
  //  {
  //   path: "videos",
  //   select: "title status imageUrl videoUrl description views author totalprice categories duration",
  //   populate: [
  //    {
  //     path: "author",
  //     select: "username email profilePic",
  //    },
  //    {
  //     path: "views.user",
  //     select: "username email profilePic",
  //    },
  //    {
  //     path: "comments.user",
  //     select: "username email profilePic",
  //    },
  //   ],
  //  },
  //  {
  //   path: "favorites",
  //   select: "title status imageUrl videoUrl views author totalprice categories duration",
  //  },
  //  {
  //   path: "followers",
  //   select: "username email profilePic userlevel usertype",
  //  },
  //  {
  //   path: "following",
  //   select: "username email profilePic userlevel usertype",
  //  }
  // );
  res.json({ token, user });
 } catch (err) {
  res.status(500).json({ error: err.message });
 }
});
// verify
router.get("/verify", authMiddleware, async (req, res) => {
 try {

  // const users = await User.insertMany([
  //   {
  //     username: "ali2",
  //     email: "ali2@example.com",
  //     password: "hashedpassword123",
  //     profilePic: ["https://example.com/profiles/ali.jpg"],
  //   },
  //   {
  //     username: "sara2",
  //     email: "sara2@example.com",
  //     password: "hashedpassword456",
  //     profilePic: ["https://example.com/profiles/sara.jpg"],
  //   },
  //   {
  //     username: "reza2",
  //     email: "reza2@example.com",
  //     password: "hashedpassword789",
  //     profilePic: ["https://example.com/profiles/reza.jpg"],
  //   }
  // ]);

  //  const conversation = await Conversation.create({
  //   members: [users[0]._id, users[1]._id],
  //   lastMessage: "سلام سارا!",
  // });

  // await Message.insertMany([
  //   {
  //     conversationId: conversation._id,
  //     sender: users[0]._id,
  //     text: "سلام سارا! خوبی؟",
  //     seenBy: [users[0]._id],
  //   },
  //   {
  //     conversationId: conversation._id,
  //     sender: users[1]._id,
  //     text: "سلام علی! مرسی، تو خوبی؟",
  //     seenBy: [users[0]._id, users[1]._id],
  //   },
  //   {
  //     conversationId: conversation._id,
  //     sender: users[0]._id,
  //     text: "آره، همه چی عالیه.",
  //     seenBy: [],
  //   },
  // ]);

  
  // console.log('req',req.headers);
  // گرفتن اطلاعات کاربر از پایگاه داده
  
  const user = await User.findById(req.user.id).populate([
   {
    path: "videos",
    select: "title status imageUrl videoUrl description views author totalprice categories duration",
    populate: [
     {
      path: "author",
      select: "username email profilePic",
     },
     {
      path: "views.user",
      select: "username email profilePic",
     },
     {
      path: "comments.user",
      select: "username email profilePic",
     },
    ],
   },
   {
    path: "favorites",
    select: "title status imageUrl videoUrl views author totalprice categories duration",
   },
   {
    path: "followers",
    select: "username email profilePic userlevel usertype",
   },
   {
    path: "following",
    select: "username email profilePic userlevel usertype",
   },
   //  {
   //   path: "currencytransaction",
   //   select: "user amount type description date",
   //  },
  ]);
  // console.log('user',user);

  if (!user) {
   return res.status(404).json({ message: "User not found." });
  }

  // بازگشت اطلاعات کاربر
  res.json({
   success: true,
   message: "User verified successfully.",
   user,
  });
 } catch (err) {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
 }
});

// edit profile user
router.post("/editprofileuser", authMiddleware, async (req, res) => {
 try {
  const { username, email, bio } = req.body;

  await User.findByIdAndUpdate(req.user.id, {
   username,
   email,
   bio,
  });

  let user = await User.findById(req.user.id);

  res.status(201).json({ user, message: "اطلاعات پروفایل آپدیت شد" });
 } catch (err) {
  res.status(500).json({ message: "خطا در ثبت اطلاعات پروفایل" });
 }
});
// edit pic user
router.post("/editprofileuser/pic", upload.single("profilePic"), authMiddleware, async (req, res) => {
 try {
  // console.log('reqqq',req.file);

  if (req.file.size > 5 * 1024 * 1024) {
   return res.status(400).json({ message: "حجم عکس بیشتر از 5 مگابایت است!" });
  }

  let pic = `uploads/images/${req.file.filename}`;
  let user = await User.findByIdAndUpdate(req.user.id, {
   $push: { profilePic: pic },
  });
  //   let u = await User.findById(req.user.id)
  //   let pic = `uploads/images/${req.file.filename}`
  //   u.profilePic.push(pic)
  //   await User.save()
  //   console.log("u =>>",user.profilePic);

  //   let user = await User.find(req.user.id);

  res.status(201).json({ pic, message: "عکس پروفایل آپدیت شد" });
 } catch (err) {
  res.status(500).json({ message: "خطا در آپلود عکس پروفایل" });
 }
});
// edit baner user
router.post("/editprofileuser/baneruser", upload.single("baneruser"), authMiddleware, async (req, res) => {
 try {
  if (req.file.size > 5 * 1024 * 1024) {
   return res.status(400).json({ message: "حجم بنر بیشتر از 5 مگابایت است!" });
  }
  let baner = `uploads/images/${req.file.filename}`;
  await User.findByIdAndUpdate(req.user.id, {
   baneruser: baner,
  });

  res.status(201).json({ baner, message: "بنرآپدیت شد" });
 } catch (err) {
  res.status(500).json({ message: "خطا در آپلود بنر" });
 }
});
//فالو
router.get("/:id/follow", authMiddleware, async (req, res) => {
 const currentUserId = req.user.id; // فرض: کاربر لاگین کرده و id تو req.user هست
 const targetUserId = req.params.id;

 try {
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
   return res.status(404).json({ message: "کاربر مورد نظر پیدا نشد" });
  }

  // چک کن اگه قبلاً فالو شده
  if (currentUser?.following?.includes(targetUserId)) {
   return res.status(400).json({ message: "قبلاً فالو کردی" });
  }

  currentUser.following.push(targetUserId);
  await currentUser.save();

  await User.findByIdAndUpdate(targetUserId, {
   $push: { followers: currentUserId },
  });

  await targetUser.save();

  console.log("ssss", currentUser?.followers);
  res.status(200).json({ user: targetUser, message: "فالو شد با موفقیت" });
 } catch (err) {
  console.error(err);
  res.status(500).json({ message: "خطا در فالو کردن" });
 }
});
// آنفالو
router.get("/:id/unfollow", authMiddleware, async (req, res) => {
 const currentUserId = req.user.id;
 const targetUserId = req.params.id;
 // console.log("currentUserId = ",currentUserId);
 // console.log("targetUserId = ",targetUserId);

 // if (currentUserId.toString() === targetUserId.toString()) {
 //  return res.status(400).json({ message: "نمی‌تونی خودتو آنفالو کنی!" });
 // }

 try {
  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!targetUser) {
   return res.status(404).json({ message: "کاربر پیدا نشد" });
  }

  // چک کن که اصلاً فالو بوده یا نه
  if (!currentUser.following.includes(targetUserId)) {
   return res.status(400).json({ message: "این کاربر رو فالو نکردی!" });
  }

  currentUser.following = currentUser.following.filter((id) => id.toString() !== targetUserId.toString());
  await currentUser.save();

  await User.findByIdAndUpdate(targetUserId, {
   $pull: { followers: currentUserId },
  });

  res.status(200).json({ message: "با موفقیت آنفالو شد" });
 } catch (err) {
  console.error(err);
  res.status(500).json({ message: "خطا در آنفالو کردن" });
 }
});
// گرفتن فالوور ها
router.get("/:id/followers", authMiddleware, async (req, res) => {
 const targetUserId = req.params.id;

 try {
  const user = await User.findById(targetUserId).populate({
   path: "followers",
   select: "username email profilePic userlevel usertype", // اطلاعات دلخواه
  });

  if (!user) {
   return res.status(404).json({ message: "کاربر پیدا نشد" });
  }

  res.status(200).json({ followers: user.followers });
 } catch (err) {
  console.error(err);
  res.status(500).json({ message: "خطا در دریافت فالوئرها" });
 }
});
// گرفتن فالویینگ ها
router.get("/:id/following", authMiddleware, async (req, res) => {
 const targetUserId = req.params.id;

 try {
  const user = await User.findById(targetUserId).populate({
   path: "following",
   select: "username email profilePic userlevel usertype", // اطلاعات دلخواه
  });

  if (!user) {
   return res.status(404).json({ message: "کاربر پیدا نشد" });
  }

  res.status(200).json({ following: user.following });
 } catch (err) {
  console.error(err);
  res.status(500).json({ message: "خطا در دریافت فالوینگ‌ها" });
 }
});

/////////////////////////////////
// api gape profile user
// profile user
router.get("/profile/:userid", authMiddleware, async (req, res) => {
 try {
  let userid = req.params.userid;
  const user = await User.findById(userid)
   .populate({
    path: "videos",
    select: "title status imageUrl videoUrl description views author totalprice categories duration",
    populate: [
     {
      path: "author",
      select: "username email profilePic",
     },
     {
      path: "views.user",
      select: "username email profilePic",
     },
     {
      path: "comments.user",
      select: "username email profilePic",
     },
    ],
   })
   .populate({
    path: "followers",
    select: "username email profilePic userlevel usertype",
   })
   .populate({
    path: "following",
    select: "username email profilePic userlevel usertype",
   });

  if (!user) {
   return res.status(404).json({ message: "User not found." });
  }
//   console.log("uservideos => ", user);

    let videos = user.videos.filter((item) => item.status === "confirmed");
  // بازگشت اطلاعات کاربر
  res.json({
   success: true,
   message: "User Find successfully.",
   user,
   videos
  });
 } catch (err) {
  console.error(err);
  res.status(500).json({ message: "Internal server error." });
 }
});
/////////////////////////////////

///////////////////////////
/// api dashboard admin ///
router.get("/admin/users", authMiddleware, async (req, res) => {
 const users = await User.find();
 res.json(users);
});

// PUT /api/users/:id
router.post('/admin/users/:id', authMiddleware,upload.single("profilePic"), async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
if (!requester) return res.status(404).json({ message: 'کاربر یافت نشد.' });

console.log('boody',req.body,req.file);

    if (!['admin', 'adminAll'].includes(requester.role)) {
      return res.status(403).json({ message: 'شما اجازه دسترسی ندارید.' });
    }

    const { id } = req.params;

    const allowedFields = [
      'username',
      'email',
      'role',
      'usertype',
      'userlevel',
      'bio',
      'status',
      'isEmailVerified',
      'balance',
      'score',
      'referralCode',
      'referredBy'
    ];

    const updates = {};
    for (let field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    if (req.file) {
      updates.profilePic = `uploads/images/${req.file.filename}`;
    }
    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedUser) return res.status(404).json({ message: 'کاربر پیدا نشد.' });

    res.status(200).json({ message: "کاربر با موفقیت ویرایش شد" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطای سرور.' });
  }
});
///////////////////////////
module.exports = router;
