const mongoose = require("mongoose");

const CATEGORIES = [
  "Cultural Events",
  "Internals",
  "Examinations & Results",
  "Placements",
  "Club Activities",
  "General Notices",
];

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true, trim: true }, // any text; CATEGORIES above are just suggestions
    isCollegeWide: { type: Boolean, default: false },
    departments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
    semesters: [{ type: Number, min: 1, max: 8 }], // empty = every semester
    publishDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    registrationLink: { type: String, trim: true },
    attachments: [{ _id: false, file: { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" }, name: String, size: Number }],
    isActive: { type: Boolean, default: true }, // admin can deactivate
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ownerDepartment: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, // HOD's dept
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);
module.exports.CATEGORIES = CATEGORIES;
