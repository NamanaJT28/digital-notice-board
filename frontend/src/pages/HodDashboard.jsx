import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import NoticeManager from "../components/NoticeManager.jsx";
import NoticeCard from "../components/NoticeCard.jsx";

const TABS = ["My notices", "Received"];

export default function HodDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState("My notices");
  return (
    <>
      <Navbar />
      <main className="container">
        <section className="card welcome">
          <h2>HOD Portal — {user.department?.name}</h2>
          <p className="muted">
            {user.canPublishCollegeWide
              ? "You can publish department and college-wide notices."
              : "You can publish notices for your department."}
          </p>
        </section>

        <div className="tabs main-tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab ${view === t ? "tab-on" : ""}`} onClick={() => setView(t)}>{t}</button>
          ))}
        </div>

        {view === "My notices" ? <NoticeManager user={user} /> : <Received user={user} />}
      </main>
    </>
  );
}

// Notices sent to this HOD's department (or the whole college) by the Principal or other HODs
function Received({ user }) {
  const [notices, setNotices] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/notices/feed").then((r) => setNotices(r.data.filter((n) => n.createdBy?._id !== user._id)));
  }, [user._id]);

  if (!notices) return <p className="center">Loading...</p>;
  const q = search.toLowerCase();
  const list = notices.filter((n) => !q || n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));

  return (
    <>
      <div className="filters" style={{ gridTemplateColumns: "1fr" }}>
        <input placeholder="Search received notices..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <p className="empty">No notices from the Principal or other departments yet.</p>
      ) : (
        <div className="grid">{list.map((n) => <NoticeCard key={n._id} notice={n} showSender />)}</div>
      )}
    </>
  );
}
