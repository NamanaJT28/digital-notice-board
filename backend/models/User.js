const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    usn: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    password: { type: String, required: true }, // bcrypt hash
    role: { type: String, enum: ["student", "teacher", "hod", "admin"], required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    semester: { type: Number },
    canPublishCollegeWide: { type: Boolean, default: false }, // for HODs
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
