require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const Department = require("./models/Department");

const app = express();

// Allow the URLs in CLIENT_URL (comma separated) and any localhost / 127.0.0.1 port during development
const allowed = (process.env.CLIENT_URL || "http://localhost:5173").split(",").map((s) => s.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json({ limit: "25mb" })); // notices can carry up to 3 files of 5 MB (base64)

app.use("/api/auth", require("./routes/auth"));
app.use("/api/notices", require("./routes/notices"));
app.use("/api/departments", require("./routes/departments"));
app.use("/api/users", require("./routes/users"));
app.use("/api/people", require("./routes/people"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Starter departments, created only if the database has none (admin can add/delete more later)
async function ensureDepartments() {
  if (await Department.countDocuments()) return;
  await Department.insertMany([
    { name: "Computer Science", code: "CSE" },
    { name: "Electronics & Communication", code: "ECE" },
    { name: "Mechanical", code: "ME" },
    { name: "Civil", code: "CV" },
  ]);
  console.log("Default departments created");
}

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await ensureDepartments();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
