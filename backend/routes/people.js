const router = require("express").Router();
const User = require("../models/User");
const { protect, allow } = require("../middleware/auth");

// Teachers can see the HOD(s) and students of THEIR OWN department only.
router.use(protect, allow("teacher"));

router.get("/", async (req, res) => {
  const department = req.user.department?._id;
  const base = { department, isActive: true };
  const [hods, students] = await Promise.all([
    User.find({ ...base, role: "hod" }).select("name email").sort({ name: 1 }),
    User.find({ ...base, role: "student" }).select("name email usn semester").sort({ semester: 1, name: 1 }),
  ]);
  res.json({ hods, students });
});

module.exports = router;
