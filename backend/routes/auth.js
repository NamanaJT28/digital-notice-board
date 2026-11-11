const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Department = require("../models/Department");
const { protect } = require("../middleware/auth");

const signToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

// GET /api/auth/setup-status
router.get("/setup-status", async (req, res) => {
  res.json({ needsAdmin: !(await User.exists({ role: "admin" })) });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, usn, password, role, department, semester } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
    if (!password || password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!["student", "teacher", "hod", "admin"].includes(role)) return res.status(400).json({ message: "Choose a valid role" });

    if (role === "admin" && (await User.exists({ role: "admin" }))) {
      return res.status(403).json({ message: "An admin already exists. Ask the admin to create your account." });
    }
    if (!(email && email.trim())) return res.status(400).json({ message: "Email is required" });
    if (role === "student" && !(Number(semester) >= 1 && Number(semester) <= 8)) {
      return res.status(400).json({ message: "Select your semester (1 to 8)" });
    }
    if (role !== "admin") {
      if (!department) return res.status(400).json({ message: "Select your department" });
      if (!(await Department.exists({ _id: department }))) return res.status(400).json({ message: "Department not found" });
    }

    // Only ONE HOD is allowed per department
    if (role === "hod" && (await User.exists({ role: "hod", department }))) {
      return res.status(400).json({ message: "An HOD already exists for this department" });
    }

    const user = await User.create({
      name: name.trim(),
      email: email && email.trim() ? email.trim().toLowerCase() : undefined,
      usn: usn && usn.trim() ? usn.trim().toUpperCase() : undefined,
      password: await bcrypt.hash(password, 10),
      role,
      department: role === "admin" ? undefined : department,
      semester: role === "student" && semester ? Number(semester) : undefined,
      canPublishCollegeWide: false,
    });

    await user.populate("department");
    res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? "This Email or USN is already registered" : e.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { identifier, password, role } = req.body;
  if (!identifier || !password) return res.status(400).json({ message: "Enter USN/Email and password" });

  const id = identifier.trim();
  const user = await User.findOne(
    id.includes("@") ? { email: id.toLowerCase() } : { usn: id.toUpperCase() }
  ).populate("department");

  if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  if (role && user.role !== role) {
    const names = { admin: "Principal", hod: "HOD", teacher: "Teacher", student: "Student" };
    return res.status(403).json({ message: `This account is not a ${names[role]} account. Choose the correct login tab.` });
  }

  res.json({ token: signToken(user), user: user.toSafeJSON() });
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => res.json(req.user.toSafeJSON()));

module.exports = router;