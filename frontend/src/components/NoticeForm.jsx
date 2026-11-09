import { useState } from "react";
import { toInputDate, fmtSize } from "../utils";

const OTHER = "__other__";
const ALLOWED = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"];
const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = () => reject(new Error(`Could not read ${file.name}`));
    r.readAsDataURL(file);
  });

// role: "hod" | "admin"
export default function NoticeForm({ initial, departments, categories, user, onSubmit, onCancel }) {
  const today = toInputDate(new Date());
  const [f, setF] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    category: initial?.category || categories[0],
    isCollegeWide: initial?.isCollegeWide || false,
    departments: initial?.departments?.map((d) => d._id || d) || [],
    semesters: initial?.semesters || [],
    publishDate: toInputDate(initial?.publishDate) || today,
    expiryDate: toInputDate(initial?.expiryDate) || "",
    registrationLink: initial?.registrationLink || "",
  });
  const [customCat, setCustomCat] = useState("");
  const [files, setFiles] = useState([]); // new files picked now
  const [keep, setKeep] = useState(initial?.attachments || []); // files already saved on this notice
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const locked = user.role !== "admin"; // HOD and teacher can only target their own department
  const canCollegeWide = user.role === "admin" || (user.role === "hod" && user.canPublishCollegeWide);
  const toggleSem = (n) =>
    set("semesters", f.semesters.includes(n) ? f.semesters.filter((x) => x !== n) : [...f.semesters, n]);

  const toggleDept = (id) =>
    set("departments", f.departments.includes(id) ? f.departments.filter((x) => x !== id) : [...f.departments, id]);

  const pickFiles = (e) => {
    const picked = [...e.target.files];
    e.target.value = "";
    const next = [...files];
    for (const file of picked) {
      const ext = file.name.split(".").pop().toLowerCase();
      if (!ALLOWED.includes(ext)) return setError(`${file.name}: this file type is not allowed`);
      if (file.size > MAX_BYTES) return setError(`${file.name} is larger than 5 MB`);
      next.push(file);
    }
    if (keep.length + next.length > MAX_FILES) return setError(`You can attach up to ${MAX_FILES} files`);
    setError("");
    setFiles(next);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const category = f.category === OTHER ? customCat.trim() : f.category;
      if (!category) return setError("Type a category name");
      setBusy(true);
      const newFiles = await Promise.all(files.map(async (file) => ({ name: file.name, data: await toBase64(file) })));
      await onSubmit({ ...f, category, newFiles, keepAttachments: keep.map((a) => a.file) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg">
      <form className="card modal" onSubmit={submit}>
        <h2>{initial ? "Edit Notice" : "Add Notice"}</h2>
        {error && <p className="error">{error}</p>}
        <label>Title<input required value={f.title} onChange={(e) => set("title", e.target.value)} /></label>
        <label>Description<textarea required rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} /></label>
        <label>Category
          <select value={f.category} onChange={(e) => set("category", e.target.value)}>
            {categories.map((c) => <option key={c}>{c}</option>)}
            <option value={OTHER}>+ Other (type your own)</option>
          </select>
        </label>
        {f.category === OTHER && (
          <label>New category name
            <input required value={customCat} onChange={(e) => setCustomCat(e.target.value)} placeholder="e.g. Sports Meet" />
          </label>
        )}

        {user.role === "teacher" ? (
          <p className="muted">This notice goes to your department ({user.department?.name}) only.</p>
        ) : (
          <fieldset>
            <legend>Target</legend>
            {canCollegeWide && (
              <label className="check">
                <input type="checkbox" checked={f.isCollegeWide} onChange={(e) => set("isCollegeWide", e.target.checked)} />
                College-wide (all departments)
              </label>
            )}
            {!f.isCollegeWide && (locked ? (
              <p className="muted">Department: {user.department?.name}</p>
            ) : (
              <div className="dept-grid">
                {departments.map((d) => (
                  <label key={d._id} className="check">
                    <input type="checkbox" checked={f.departments.includes(d._id)} onChange={() => toggleDept(d._id)} />
                    {d.code}
                  </label>
                ))}
              </div>
            ))}
          </fieldset>
        )}

        <fieldset>
          <legend>Semesters</legend>
          <p className="muted" style={{ margin: "0 0 6px" }}>
            {f.semesters.length === 0 ? "All semesters will see this notice." : `Only semester ${f.semesters.join(", ")} students will see this notice.`}
          </p>
          <div className="dept-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <label key={n} className="check">
                <input type="checkbox" checked={f.semesters.includes(n)} onChange={() => toggleSem(n)} />
                Sem {n}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="row2">
          <label>Publication date<input type="date" required value={f.publishDate} onChange={(e) => set("publishDate", e.target.value)} /></label>
          <label>Expiry date<input type="date" required min={f.publishDate} value={f.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} /></label>
        </div>
        <label>Registration link (optional)<input type="url" placeholder="https://..." value={f.registrationLink} onChange={(e) => set("registrationLink", e.target.value)} /></label>

        <fieldset>
          <legend>Attachments (optional)</legend>
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={pickFiles} />
          <p className="muted" style={{ margin: "6px 0 0" }}>Up to 3 files, 5 MB each: PDF, image, Word, Excel, PowerPoint or text.</p>
          <ul className="file-list">
            {keep.map((a) => (
              <li key={a.file}>
                <span>📎 {a.name} <span className="muted">({fmtSize(a.size)})</span></span>
                <button type="button" className="link-btn" onClick={() => setKeep(keep.filter((x) => x.file !== a.file))}>Remove</button>
              </li>
            ))}
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`}>
                <span>📎 {file.name} <span className="muted">({fmtSize(file.size)})</span></span>
                <button type="button" className="link-btn" onClick={() => setFiles(files.filter((_, j) => j !== i))}>Remove</button>
              </li>
            ))}
          </ul>
        </fieldset>

        <div className="actions">
          <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? "Saving..." : "Save Notice"}</button>
        </div>
      </form>
    </div>
  );
}
