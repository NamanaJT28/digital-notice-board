const router = require("express").Router();
const Department = require("../models/Department");
const User = require("../models/User");
const { protect, allow } = require("../middleware/auth");

// Public list (needed by the register page before the person is logged in)
router.get("/public", async (req, res) => {
  res.json(await Department.find().select("name code").sort({ name: 1 }));
});

router.use(protect);

router.get("/", async (req, res) => {
  res.json(await Department.find().sort({ name: 1 }));
});

router.post("/", allow("admin"), async (req, res) => {
  try {
    const dept = await Department.create({ name: req.body.name, code: req.body.code });
    res.status(201).json(dept);
  } catch (e) {
    res.status(400).json({ message: e.code === 11000 ? "Department already exists" : e.message });
  }
});

router.delete("/:id", allow("admin"), async (req, res) => {
  const inUse = await User.exists({ department: req.params.id });
  if (inUse) return res.status(400).json({ message: "Department has users; remove them first" });
  await Department.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
