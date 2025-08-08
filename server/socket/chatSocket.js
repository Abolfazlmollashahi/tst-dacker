// socket/chatSocket.js
const Message = require("../models/Chat/Message");
const Conversation = require("../models/Chat/Conversation");
const User = require("../models/User");
const { default: mongoose } = require("mongoose");

const onlineUsers = new Set();

module.exports = (io) => {
 io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  onlineUsers.add(userId);
  console.log("✅ کاربر متصل شد:", socket.id);
  console.log(" userid =>> ", userId);

  socket.on("get_conversations", async () => {
   try {
    const conversations = await Conversation.find({ members: userId })
    .populate("members", "_id username email profilePic")
    .populate({
      path: "lastMessage",
      populate: { path: "sender", select: "username email profilePic" }, // اختیاری
    }).sort({ updatedAt: -1 });
    socket.emit("conversations_list", conversations);
    console.log('111');
    
   } catch (err) {
    console.error("Error loading conversations:", err);
   }
  });

  // ساخت کانورزیشن جدید با یک یوزر
  socket.on("start_conversation", async ({ senderId, receiverId }) => {
   try {
    let convo = await Conversation.findOne({
     members: { $all: [senderId, receiverId] },
    });

    if (!convo) {
     convo = await Conversation.create({
      members: [senderId, receiverId],
     });
    }

    convo = await convo.populate("members", "username email profilePic");
    socket.emit("conversation_started", convo);
   } catch (err) {
    console.error(err);
   }
  });

  socket.on("typing", ({ conversationId, userId, username }) => {
   socket.broadcast.to(conversationId).emit("userTyping", { userId, username });
  });

  // join user to a room (conversation)
  socket.on("joinRoom", (conversationId) => {
   socket.join(conversationId);
   console.log(`Socket ${socket.id} joined room ${conversationId}`);
  });

  // get messages conversastion
  socket.on("get_messages", async ({ conversationId }) => {
   try {
    let messages = await Message.find({ conversationId }).populate("sender","username email profilePic").sort({ createdAt: 1 });
    socket.emit("Messages", messages);
   } catch (error) {}
  });

  // seen message
  socket.on("mark_seen", async ({ conversationId, userId }) => {
   await Message.updateMany(
    {
     conversationId,
     sender: { $ne: userId },
     seenBy: { $ne: userId },
    },
    {
     $addToSet: { seenBy: userId },
    }
   );

   const messages = await Message.find({
    conversationId,
    seenBy: userId,
   });

   messages.forEach((msg) => {
    console.log("update seen");

    if (msg.sender.toString() !== userId) {
     io.to(conversationId).emit("message_seen", {
      messageId: msg._id.toString(),
      seenBy: userId.toString(),
     });
    }
   });
  });

  socket.on("get_unread_counts", async ({ userId }) => {
   try {
    const conversations = await Conversation.find({ members: userId });

    const unreadCounts = {};

    for (const convo of conversations) {
     const count = await Message.countDocuments({
      conversationId: convo._id,
      sender: { $ne: userId },
      seenBy: { $ne: userId },
     });

     unreadCounts[convo._id] = count;
    }
console.log('unreadCounts => ', unreadCounts);

    socket.emit("unread_counts", unreadCounts);
   } catch (err) {
    console.error(" Error fetching unread counts:", err.message);
    socket.emit("unread_counts", {});
   }
  });

  // handle sending a message
  socket.on("sendMessage", async ({ conversationId, sender, receiver, text, file }) => {
   try {
    console.log(conversationId, sender, receiver, text);

    let conversation = await Conversation.findOne({
     members: { $all: [sender, receiver] },
    });

    if (!conversation) {
     conversation = await Conversation.create({
      members: [sender, receiver],
     });
    }

    const message = await Message.create({
     conversationId: conversation._id,
     sender: sender,
     text: text || "",
     file : file || null,
     delivered: true,
     pending: false,
    });

    // update lastMessage in conversation
    conversation.lastMessage =  message._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    const msg = await Message.findById(message._id).populate("sender","username email profilePic")

    io.to(sender).emit("message_sent", msg);
    io.to(conversationId).emit("receive_message", msg);
    
    const unread = await Message.countDocuments({
      conversationId: conversation._id,
      sender: { $ne: receiver },
      seenBy: { $ne: receiver },
     });
     
     io.to(receiver.toString()).emit("unread_counts_update", {
      conversationId: conversation._id.toString(),
      count: unread,
     });

   } catch (err) {
    console.error("❌ Error sending message:", err);
   }
  });

  //  search user
  socket.on("search_user", async (username) => {
   try {
    if (!username || username.trim() === "") return;

    const regex = new RegExp("^" + username, "i");
    const users = await User.find({
     username: { $regex: regex },
     isDeleted: false,
    }).select("_id username email profilePic");

    socket.emit("search_result", users);
   } catch (error) {
    console.error("Search Error:", error.message);
    socket.emit("search_result", []);
   }
  });

  socket.on("get_chat_users", async () => {
   try {
    const conversations = await Conversation.find({ members: userId }).populate("members", "_id username email profilePic");

    // فقط یوزرهای غیر از خود کاربر
    const chatUsers = conversations.map((c) => c.members.find((m) => m._id.toString() !== userId)).filter(Boolean);

    socket.emit("chat_user_list", chatUsers);
   } catch (err) {
    console.error("❌ Error fetching chat users:", err);
    socket.emit("chat_user_list", []);
   }
  });

  socket.on("get_online_users", () => {
   socket.emit("online_users", Array.from(onlineUsers));
  });

  socket.on("disconnect", () => {
   onlineUsers.delete(userId);
   console.log("🔌 کاربر قطع شد:", socket.id);
  });
 });
};
