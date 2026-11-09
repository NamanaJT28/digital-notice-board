import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import NoticeCard from "./NoticeCard.jsx";
import NoticeForm from "./NoticeForm.jsx";
import { statusOf, CATEGORIES } from "../utils";

// Shared notice management used by both HOD and Admin dashboards
export default function NoticeManager({ user }) {
  const [notices, setNotices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null); // null | "new" | notice
  const [tab, setTab] = useState("active");
  const isAdmin = user.role === "admin";

  const load = () => api.get("/notices/manage").then((r) => setNotices(r.data));
  useEffect(() => {
    load();
    api.get("/departments").then((r) => setDepartments(r.data));
  }, []);

  const save = async (form) => {
    try {
      if (editing === "new") await api.post("/notices", form);
      else await api.put(`/notices/${editing._id}`, form);
      setEditing(null);
      load();
    } catch (e) {
      throw new Error(errMsg(e));
    }
  };

  const remove = async (n) => {
    if (!confirm(`Delete "${n.title}"?`)) return;
    await api.delete(`/notices/${n._id}`).catch((e) => alert(errMsg(e)));
    load();
  };

  const toggle = async (n) => {
    await api.patch(`/notices/${n._id}/toggle`);
    load();
  };

  // default categories + any custom category already saved in the database
  const categories = [...new Set([...CATEGORIES.map((c) => c.name), ...notices.map((n) => n.category)])];

  const counts = { active: 0, upcoming: 0, expired: 0, inactive: 0 };
  notices.forEach((n) => counts[statusOf(n)]++);
  const tabs = isAdmin ? ["active", "upcoming", "expired", "inactive"] : ["active", "upcoming", "expired"];
  const shown = notices.filter((n) => statusOf(n) === tab);

  return (
    <>
      <div className="stats">
        {tabs.map((t) => (
          <div key={t} className={`card stat stat-${t}`}>
            <span className="stat-num">{counts[t]}</span>
            <span className="muted">{t[0].toUpperCase() + t.slice(1)} notices</span>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="tabs">
          {tabs.map((t) => (
            <button key={t} className={`tab ${tab === t ? "tab-on" : ""}`} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => setEditing("new")}>+ Add Notice</button>
      </div>

      {shown.length === 0 ? (
        <p className="empty">No {tab} notices.</p>
      ) : (
        <div className="grid">
          {shown.map((n) => (
            <NoticeCard
              key={n._id}
              notice={n}
              actions={
                <>
                  <button className="btn btn-outline" onClick={() => setEditing(n)}>Edit</button>
                  {isAdmin && (
                    <button className="btn btn-outline" onClick={() => toggle(n)}>
                      {n.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => remove(n)}>Delete</button>
                </>
              }
            />
          ))}
        </div>
      )}

      {editing && (
        <NoticeForm
          initial={editing === "new" ? null : editing}
          departments={departments}
          categories={categories}
          user={user}
          onSubmit={save}
          onCancel={() => setEditing(null)}
        />
      )}
    </>
  );
}
