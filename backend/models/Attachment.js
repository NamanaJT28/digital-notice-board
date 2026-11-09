const mongoose = require("mongoose");

// Files attached to notices are stored in MongoDB itself, so they survive redeploys on Render.
const attachmentSchema = new mongoose.Schema(
  {
    notice: { type: mongoose.Schema.Types.ObjectId, ref: "Notice", index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attachment", attachmentSchema);
