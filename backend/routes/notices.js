const router = require("express").Router();
const Notice = require("../models/Notice");
const Attachment = require("../models/Attachment");
const { protect, allow } = require("../middleware/auth");

router.use(protect);

const populate = (q) => q.populate("departments", "name code").populate("createdBy", "name role");

// Can this user edit/delete this notice?
function canModify(user, notice) {
  if (user.role === "admin") return true;
  if (user.role === "hod") {
    return String(notice.ownerDepartment) === String(user.department?._id);
  }
  if (user.role === "teacher") return String(notice.createdBy) === String(user._id);
  return false;
}

// ---------- Attachments ----------
const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
};

// body.newFiles = [{ name, data(base64) }] -> validated [{ name, type, size, data(Buffer) }]
function cleanFiles(list) {
  if (!Array.isArray(list)) return [];
  return list.map((f) => {
    const name = String(f.name || "file").replace(/[\\/]/g, "_").slice(0, 120);
    const ext = name.split(".").pop().toLowerCase();
    if (!TYPES[ext]) throw new Error(`File type not allowed: ${name}`);
    const buf = Buffer.from(String(f.data || ""), "base64");
    if (!buf.length) throw new Error(`File is empty: ${name}`);
    if (buf.length > MAX_BYTES) throw new Error(`${name} is larger than 5 MB`);
    return { name, type: TYPES[ext], size: buf.length, data: buf };
  });
}

async function addFiles(notice, files, uploader) {
  for (const f of files) {
    const doc = await Attachment.create({ ...f, notice: notice._id, uploadedBy: uploader });
    notice.attachments.push({ file: doc._id, name: f.name, size: f.size });
  }
  await notice.save();
}

// Can this user see this notice (and so download its files)?
function canView(user, notice) {
  if (canModify(user, notice)) return true;
  const mine = String(user.department?._id);
  const forMyDept = notice.isCollegeWide || notice.departments.some((d) => String(d) === mine);
  if (!forMyDept) return false;
  if (user.role === "student" && notice.semesters?.length) return notice.semesters.includes(user.semester);
  return true;
}

// Validate and clean incoming notice data according to role
function buildNotice(user, body) {
  const data = {
    title: body.title,
    description: body.description,
    category: (body.category || "").trim(),
    publishDate: body.publishDate,
    expiryDate: body.expiryDate,
    registrationLink: body.registrationLink || "",
    isCollegeWide: !!body.isCollegeWide,
    departments: Array.isArray(body.departments) ? body.departments : [],
    // semesters 1-8; leave empty to reach every semester
    semesters: [...new Set((Array.isArray(body.semesters) ? body.semesters : []).map(Number).filter((n) => n >= 1 && n <= 8))].sort(),
  };
  if (new Date(data.expiryDate) < new Date(data.publishDate)) {
    throw new Error("Expiry date must be after publication date");
  }
  if (user.role === "hod" || user.role === "teacher") {
    if (data.isCollegeWide && !(user.role === "hod" && user.canPublishCollegeWide)) {
      throw new Error("You are not authorized to publish college-wide notices");
    }
    // HODs and teachers may only target their own department
    data.departments = [user.department._id];
  }
  if (!data.isCollegeWide && data.departments.length === 0) {
    throw new Error("Select at least one target department");
  }
  if (data.isCollegeWide) data.departments = [];
  return data;
}

// GET /api/notices/feed  -> active notices visible to a student, teacher or HOD (college-wide + own department)
router.get("/feed", async (req, res) => {
  const now = new Date();
  const filter = {
    isActive: true,
    publishDate: { $lte: now },
    expiryDate: { $gte: now },
  };
  const forMyDept = { $or: [{ isCollegeWide: true }, { departments: req.user.department?._id }] };
  if (req.user.role === "student") {
    // Students only get notices for their own semester (or notices with no semester restriction)
    const sem = req.user.semester;
    filter.$and = [
      forMyDept,
      { $or: [{ semesters: { $size: 0 } }, { semesters: { $exists: false } }, ...(sem ? [{ semesters: sem }] : [])] },
    ];
  } else if (req.user.role === "teacher" || req.user.role === "hod") {
    Object.assign(filter, forMyDept); // teachers and HODs see every semester of their department
  }
  const notices = await populate(Notice.find(filter)).sort({ expiryDate: 1 });
  res.json(notices);
});

// GET /api/notices/manage -> HOD: own department's notices; admin: all (including expired history)
router.get("/manage", allow("hod", "teacher", "admin"), async (req, res) => {
  const filter =
    req.user.role === "hod" ? { ownerDepartment: req.user.department._id } :
    req.user.role === "teacher" ? { createdBy: req.user._id } : {};
  const notices = await populate(Notice.find(filter)).sort({ createdAt: -1 });
  res.json(notices);
});

router.post("/", allow("hod", "teacher", "admin"), async (req, res) => {
  try {
    const data = buildNotice(req.user, req.body);
    const files = cleanFiles(req.body.newFiles);
    if (files.length > MAX_FILES) throw new Error(`You can attach up to ${MAX_FILES} files`);
    data.createdBy = req.user._id;
    data.ownerDepartment = req.user.role !== "admin" ? req.user.department._id : undefined;
    const notice = await Notice.create(data);
    await addFiles(notice, files, req.user._id);
    res.status(201).json(notice);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

router.put("/:id", allow("hod", "teacher", "admin"), async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ message: "Notice not found" });
  if (!canModify(req.user, notice)) return res.status(403).json({ message: "You cannot edit this notice" });
  try {
    const data = buildNotice(req.user, req.body);
    const files = cleanFiles(req.body.newFiles);
    // keepAttachments = ids of existing files to keep (if not sent, keep all)
    const keep = Array.isArray(req.body.keepAttachments) ? new Set(req.body.keepAttachments.map(String)) : null;
    const kept = keep ? notice.attachments.filter((a) => keep.has(String(a.file))) : notice.attachments;
    const removed = keep ? notice.attachments.filter((a) => !keep.has(String(a.file))).map((a) => a.file) : [];
    if (kept.length + files.length > MAX_FILES) throw new Error(`You can attach up to ${MAX_FILES} files`);
    Object.assign(notice, data);
    notice.attachments = kept;
    await addFiles(notice, files, req.user._id); // saves the notice
    if (removed.length) await Attachment.deleteMany({ _id: { $in: removed } });
    res.json(notice);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// PATCH /api/notices/:id/toggle -> admin activates/deactivates
router.patch("/:id/toggle", allow("admin"), async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ message: "Notice not found" });
  notice.isActive = !notice.isActive;
  await notice.save();
  res.json(notice);
});

router.delete("/:id", allow("hod", "teacher", "admin"), async (req, res) => {
  const notice = await Notice.findById(req.params.id);
  if (!notice) return res.status(404).json({ message: "Notice not found" });
  if (!canModify(req.user, notice)) return res.status(403).json({ message: "You cannot delete this notice" });
  await notice.deleteOne();
  await Attachment.deleteMany({ notice: notice._id });
  res.json({ message: "Deleted" });
});

// GET /api/notices/files/:id -> download an attached file (only if the user may see the notice)
router.get("/files/:id", async (req, res) => {
  const att = await Attachment.findById(req.params.id);
  if (!att) return res.status(404).json({ message: "File not found" });
  const notice = await Notice.findById(att.notice);
  if (!notice || !canView(req.user, notice)) return res.status(403).json({ message: "You cannot access this file" });
  res.set({
    "Content-Type": att.type,
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(att.name)}`,
    "X-Content-Type-Options": "nosniff",
  });
  res.send(att.data);
});

module.exports = router;
