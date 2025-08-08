const jwt = require("jsonwebtoken");

// Middleware برای احراز هویت
const authMiddleware = (req, res, next) => {
  // دریافت توکن از هدر Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "خطا در ورود لطفا دوباره وارد اکانت شوید" });
  }

  const token = authHeader.split(" ")[1]; // جدا کردن "Bearer" از توکن

  try {
    // بررسی توکن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // اضافه کردن اطلاعات کاربر به درخواست
    next(); // ادامه پردازش درخواست
  } catch (err) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

module.exports = authMiddleware;