import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "../components/AuthShell.jsx";

const HOME = { student: "/student", teacher: "/teacher", hod: "/hod", admin: "/admin" };
const EMPTY = { role: "student", name: "", usn: "", email: "", semester: "", department: "", password: "", confirm: "" };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState(EMPTY);
  const [depts, setDepts] = useState([]);
  const [needsAdmin, setNeedsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    api.get("/departments/public").then((r) => setDepts(r.data)).catch(() => {});
    api.get("/auth/setup-status").then((r) => setNeedsAdmin(r.data.needsAdmin)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.password !== f.confirm) return setError("Passwords do not match");
    setBusy(true);
    try {
      const { confirm, ...payload } = f;
      const user = await register(payload); // saved in MongoDB, then logged in
      navigate(HOME[user.role]);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell>
      <form className="auth-form" onSubmit={submit}>
        <h1>Create your account</h1>
        <p className="muted">It takes a minute. Use the email you will log in with.</p>
        {error && <p className="error">{error}</p>}

        <label>I am a
          <select value={f.role} onChange={(e) => set("role", e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="hod">HOD</option>
            {needsAdmin && <option value="admin">Principal (first-time setup)</option>}
          </select>
        </label>

        <label>Full name
          <input required value={f.name} onChange={(e) => set("name", e.target.value)} />
        </label>

        <label>Email
          <input required type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@college.edu" />
        </label>

        {f.role === "student" && (
          <>
            <label>USN (optional)
              <input value={f.usn} onChange={(e) => set("usn", e.target.value)} placeholder="1AB21CS001" />
            </label>
            <label>Semester
              <input required type="number" min="1" max="8" value={f.semester} onChange={(e) => set("semester", e.target.value)} />
            </label>
          </>
        )}

        {f.role !== "admin" && (
          <label>Department
            <select required value={f.department} onChange={(e) => set("department", e.target.value)}>
              <option value="">Select department</option>
              {depts.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
            </select>
          </label>
        )}

        <label>Password
          <input required type="password" minLength={6} value={f.password} onChange={(e) => set("password", e.target.value)} />
        </label>
        <label>Confirm password
          <input required type="password" minLength={6} value={f.confirm} onChange={(e) => set("confirm", e.target.value)} />
        </label>

        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
        <p className="auth-alt muted">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </AuthShell>
  );
}
