const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT and loads the user from the database (role comes from DB, never from the client)
async function protect(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Not logged in" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate("department");
    if (!user || !user.isActive) return res.status(401).json({ message: "Account not found" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}

function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Access denied" });
    next();
  };
}

module.exports = { protect, allow };
