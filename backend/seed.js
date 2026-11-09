// Creates the first Principal/Admin account from .env values, plus a few departments.
// Run once:  npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Department = require("./models/Department");

(async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);

  const depts = [
    { name: "Computer Science", code: "CSE" },
    { name: "Electronics & Communication", code: "ECE" },
    { name: "Mechanical", code: "ME" },
    { name: "Civil", code: "CV" },
  ];
  for (const d of depts) await Department.updateOne({ code: d.code }, d, { upsert: true });

  if (await User.exists({ role: "admin" })) {
    console.log("An admin already exists. Skipping admin creation.");
  } else {
    await User.create({
      name: ADMIN_NAME || "Principal",
      email: ADMIN_EMAIL.toLowerCase(),
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "admin",
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }
  await mongoose.disconnect();
})();
