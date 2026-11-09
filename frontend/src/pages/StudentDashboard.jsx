import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import NoticeCard from "../components/NoticeCard.jsx";
import { CATEGORIES, iconFor, daysLeft, expiryLabel } from "../utils";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("all");
  const [cat, setCat] = useState("all");
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    api.get("/notices/feed").then((r) => setNotices(r.data));
  }, []);

  // default categories + any custom category used in saved notices
  const categories = [...new Set([...CATEGORIES.map((c) => c.name), ...notices.map((n) => n.category)])];

  // Deadlines within 3 days
  const upcoming = notices.filter((n) => daysLeft(n.expiryDate) >= 0 && daysLeft(n.expiryDate) <= 3);

  const filtered = notices.filter((n) => {
    const q = search.toLowerCase();
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
    const matchC = cat === "all" || n.category === cat;
    const matchD =
      dept === "all" || (dept === "college" ? n.isCollegeWide : !n.isCollegeWide);
    return matchQ && matchC && matchD;
  });

  return (
    <>
      <Navbar>
        <div className="bell-wrap">
          <button className="bell" onClick={() => setBellOpen(!bellOpen)} aria-label="Notifications">
            🔔{upcoming.length > 0 && <span className="bell-count">{upcoming.length}</span>}
          </button>
          {bellOpen && (
            <div className="card bell-menu">
              <strong>Upcoming deadlines</strong>
              {upcoming.length === 0 ? (
                <p className="muted">No deadlines in the next 3 days.</p>
              ) : (
                upcoming.map((n) => (
                  <div key={n._id} className="bell-item">
                    <span>{n.title}</span>
                    <span className="badge badge-orange">{expiryLabel(n.expiryDate)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Navbar>

      <main className="container">
        <section className="card welcome">
          <h2>Welcome, {user.name} 👋</h2>
          <p className="muted">
            {user.usn ? `USN: ${user.usn} · ` : ""}{user.email} · Department: {user.department?.name}{user.semester ? ` · Semester ${user.semester}` : ""}
          </p>
        </section>

        <div className="filters">
          <input placeholder="Search notices..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">All departments</option>
            <option value="college">College-wide</option>
            <option value="mine">{user.department?.code} only</option>
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{iconFor(c)} {c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="empty">No notices match your filters.</p>
        ) : (
          <div className="grid">{filtered.map((n) => <NoticeCard key={n._id} notice={n} />)}</div>
        )}
      </main>
    </>
  );
}
