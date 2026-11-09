import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { errMsg } from "../api";
import AuthShell from "../components/AuthShell.jsx";

const HOME = { student: "/student", teacher: "/teacher", hod: "/hod", admin: "/admin" };
const ROLES = [
  { key: "admin", label: "Principal" },
  { key: "hod", label: "HOD" },
  { key: "teacher", label: "Teacher" },
  { key: "student", label: "Student" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const roleLabel = ROLES.find((r) => r.key === role).label;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = await login(email, password, role);
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
        <h1>{roleLabel} login</h1>
        <p className="muted">Sign in with the email you registered with.</p>

        <div className="seg" role="tablist" aria-label="Login as">
          {ROLES.map((r) => (
            <button
              type="button"
              role="tab"
              aria-selected={role === r.key}
              key={r.key}
              className={role === r.key ? "on" : ""}
              onClick={() => { setRole(r.key); setError(""); }}
            >
              {r.label}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        <label>Email
          <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label>Password
          <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
        <p className="auth-alt muted">New here? <Link to="/register">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
