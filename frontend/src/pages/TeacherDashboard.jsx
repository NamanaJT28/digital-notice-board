import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import NoticeCard from "../components/NoticeCard.jsx";
import NoticeManager from "../components/NoticeManager.jsx";
import { CATEGORIES, iconFor, daysLeft, expiryLabel } from "../utils";

const TABS = ["Notices", "My notices", "My Department"];

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState("Notices");

  return (
    <>
      <Navbar />
      <main className="container">
        <section className="card welcome">
          <h2>Welcome, {user.name} 👋</h2>
          <p className="muted">{user.email} · Department: {user.department?.name}</p>
        </section>

        <div className="tabs main-tabs" style={{ marginBottom: 16 }}>
          {TABS.map((t) => (
            <button key={t} className={`tab ${view === t ? "tab-on" : ""}`} onClick={() => setView(t)}>{t}</button>
          ))}
        </div>

        {view === "Notices" ? <Notices user={user} /> : view === "My notices" ? <NoticeManager user={user} /> : <People />}
      </main>
    </>
  );
}

// All active notices for the teacher: college-wide + own department, from the Principal and HODs
function Notices({ user }) {
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("all");
  const [scope, setScope] = useState("all");
  const [cat, setCat] = useState("all");

  useEffect(() => {
    api.get("/notices/feed").then((r) => setNotices(r.data));
  }, []);

  const categories = [...new Set([...CATEGORIES.map((c) => c.name), ...notices.map((n) => n.category)])];
  const upcoming = notices.filter((n) => daysLeft(n.expiryDate) >= 0 && daysLeft(n.expiryDate) <= 3);

  const filtered = notices.filter((n) => {
    const q = search.toLowerCase();
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
    const matchC = cat === "all" || n.category === cat;
    const matchS = scope === "all" || (scope === "college" ? n.isCollegeWide : !n.isCollegeWide);
    const matchF = from === "all" || n.createdBy?.role === from;
    return matchQ && matchC && matchS && matchF;
  });

  return (
    <>
      {upcoming.length > 0 && (
        <section className="card" style={{ marginBottom: 16 }}>
          <strong>🔔 Deadlines in the next 3 days</strong>
          {upcoming.map((n) => (
            <div key={n._id} className="bell-item">
              <span>{n.title}</span>
              <span className="badge badge-orange">{expiryLabel(n.expiryDate)}</span>
            </div>
          ))}
        </section>
      )}

      <div className="filters">
        <input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="all">All senders</option>
          <option value="admin">Principal</option>
          <option value="hod">HOD</option>
          <option value="teacher">Teacher</option>
        </select>
        <select value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">College-wide + {user.department?.code}</option>
          <option value="college">College-wide only</option>
          <option value="dept">{user.department?.code} only</option>
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{iconFor(c)} {c}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">No notices match your filters.</p>
      ) : (
        <div className="grid">{filtered.map((n) => <NoticeCard key={n._id} notice={n} showSender />)}</div>
      )}
    </>
  );
}

// HOD(s) and students of the teacher's own department
function People() {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.get("/people").then((r) => setData(r.data));
  }, []);

  if (!data) return <p className="center">Loading...</p>;

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3>HOD ({data.hods.length})</h3>
        {data.hods.length === 0 ? (
          <p className="muted">No HOD registered for this department yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th></tr></thead>
              <tbody>{data.hods.map((h) => <tr key={h._id}><td>{h.name}</td><td>{h.email}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Students ({data.students.length})</h3>
        {data.students.length === 0 ? (
          <p className="muted">No students registered for this department yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>USN</th><th>Sem</th></tr></thead>
              <tbody>
                {data.students.map((s) => (
                  <tr key={s._id}><td>{s.name}</td><td>{s.email}</td><td>{s.usn || "-"}</td><td>{s.semester || "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
