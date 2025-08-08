require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const uploadChat = require("./middleware/chatMiddlewareUploadFile");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/auth"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/ads",require("./routes/ads"));
app.use("/api/notification", require("./routes/notification"));
app.post("/api/chat/uploads", uploadChat.single("file") , authMiddleware, (req, res) => {
  const fileUrl = `/uploads/chats/${req.file.filename}`;
  res.json({ url: fileUrl });
});
app.get("/", (req, res) => {
    res.send("Server is running...");
  });
// Start Server
module.exports = app