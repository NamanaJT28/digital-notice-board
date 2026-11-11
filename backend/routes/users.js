
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect, allow } = require("../middleware/auth");

// Only the Principal/Admin can create accounts. There is no public sign-up.
router.use(protect, allow("admin"));

router.get("/", async (req, res) => {
  const filter = req.query.role
    ? { role: req.query.role }
    : { role: { $ne: "admin" } };

  const users = await User.find(filter)
    .select("-password")
    .populate("department", "name code")
    .sort({ name: 1 });

  res.json(users);
});

router.post("/", async (req, res) => {
  const {
    name,
    email,
    usn,
    password,
    role,
    department,
    semester,
    canPublishCollegeWide
  } = req.body;

  if (!["student", "teacher", "hod"].includes(role))
    return res.status(400).json({
      message: "Role must be student, teacher or hod"
    });

  if (!password || password.length < 6)
    return res.status(400).json({
      message: "Password must be at least 6 characters"
    });

  if (!department)
    return res.status(400).json({
      message: "Department is required"
    });

  if (!email)
    return res.status(400).json({
      message: "Email is required"
    });

  // Only ONE HOD is allowed per department
  if (role === "hod" && (await User.exists({ role: "hod", department }))) {
    return res.status(400).json({
      message: "An HOD already exists for this department"
    });
  }

  // Student semester validation
  if (
    role === "student" &&
    !(Number(semester) >= 1 && Number(semester) <= 8)
  )
    return res.status(400).json({
      message: "Semester (1 to 8) is required for students"
    });

  try {
    const user = await User.create({
      name,
      email: email || undefined,
      usn: usn || undefined,
      password: await bcrypt.hash(password, 10),
      role,
      department,
      semester: role === "student" ? semester : undefined,
      canPublishCollegeWide: role === "hod" ? !!canPublishCollegeWide : false,
    });

    res.status(201).json(user.toSafeJSON());

  } catch (e) {
    res.status(400).json({
      message: e.code === 11000
        ? "Email or USN already in use"
        : e.message
    });
  }
});

router.patch("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user || user.role === "admin")
    return res.status(404).json({ message: "User not found" });

  if (typeof req.body.canPublishCollegeWide === "boolean")
    user.canPublishCollegeWide = req.body.canPublishCollegeWide;

  if (typeof req.body.isActive === "boolean")
    user.isActive = req.body.isActive;

  await user.save();

  res.json(user.toSafeJSON());
});

router.delete("/:id", async (req, res) => {
  await User.deleteOne({
    _id: req.params.id,
    role: { $ne: "admin" }
  });

  res.json({ message: "Deleted" });
});

module.exports = router;