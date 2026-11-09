import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import NoticeManager from "../components/NoticeManager.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [view, setView] = useState("notices");
  return (
    <>
      <Navbar />
      <main className="container">
        <section className="card welcome">
          <h2>Principal / Admin Portal</h2>
          <p className="muted">Manage notices across all departments, departments and user accounts.</p>
        </section>
        <div className="tabs main-tabs">
          {["notices", "departments", "users"].map((v) => (
            <button key={v} className={`tab ${view === v ? "tab-on" : ""}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
        {view === "notices" && <NoticeManager user={user} />}
        {view === "departments" && <Departments />}
        {view === "users" && <Users />}
      </main>
    </>
  );
}

function Departments() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const load = () => api.get("/departments").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/departments", { name, code });
      setName(""); setCode(""); load();
    } catch (err) { alert(errMsg(err)); }
  };
  const del = async (d) => {
    if (!confirm(`Delete ${d.name}?`)) return;
    await api.delete(`/departments/${d._id}`).catch((e) => alert(errMsg(e)));
    load();
  };

  return (
    <div className="card">
      <form className="inline-form" onSubmit={add}>
        <input required placeholder="Department name" value={name} onChange={(e) => setName(e.target.value)} />
        <input required placeholder="Code (e.g. CSE)" value={code} onChange={(e) => setCode(e.target.value)} />
        <button className="btn btn-primary">Add</button>
      </form>
      <table className="table">
        <thead><tr><th>Code</th><th>Name</th><th></th></tr></thead>
        <tbody>
          {list.map((d) => (
            <tr key={d._id}><td>{d.code}</td><td>{d.name}</td>
              <td><button className="btn btn-danger" onClick={() => del(d)}>Delete</button></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const EMPTY = { name: "", email: "", usn: "", password: "", role: "hod", department: "", semester: "", canPublishCollegeWide: false };

function Users() {
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [f, setF] = useState(EMPTY);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const load = () => api.get("/users").then((r) => setUsers(r.data));
  useEffect(() => { load(); api.get("/departments").then((r) => setDepts(r.data)); }, []);

  const add = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", f);
      setF(EMPTY); load();
    } catch (err) { alert(errMsg(err)); }
  };
  const patch = async (u, body) => { await api.patch(`/users/${u._id}`, body); load(); };
  const del = async (u) => {
    if (!confirm(`Delete ${u.name}?`)) return;
    await api.delete(`/users/${u._id}`); load();
  };

  return (
    <div className="card">
      <h3>Create account</h3>
      <form className="user-form" onSubmit={add}>
        <select value={f.role} onChange={(e) => set("role", e.target.value)}>
          <option value="hod">HOD</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
        <input required placeholder="Full name" value={f.name} onChange={(e) => set("name", e.target.value)} />
        <input required type="email" placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} />
        {f.role === "student" && (
          <>
            <input placeholder="USN (optional)" value={f.usn} onChange={(e) => set("usn", e.target.value)} />
            <input required type="number" min="1" max="8" placeholder="Semester" value={f.semester} onChange={(e) => set("semester", e.target.value)} />
          </>
        )}
        <input required type="password" minLength={6} placeholder="Initial password" value={f.password} onChange={(e) => set("password", e.target.value)} />
        <select required value={f.department} onChange={(e) => set("department", e.target.value)}>
          <option value="">Department</option>
          {depts.map((d) => <option key={d._id} value={d._id}>{d.code}</option>)}
        </select>
        {f.role === "hod" && (
          <label className="check">
            <input type="checkbox" checked={f.canPublishCollegeWide} onChange={(e) => set("canPublishCollegeWide", e.target.checked)} />
            Can publish college-wide
          </label>
        )}
        <button className="btn btn-primary">Create</button>
      </form>

      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Role</th><th>Login ID</th><th>Dept</th><th>College-wide</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td><td>{u.role}</td><td>{u.email || u.usn}</td><td>{u.department?.code}</td>
                <td>{u.role === "hod" && (
                  <input type="checkbox" checked={u.canPublishCollegeWide} onChange={(e) => patch(u, { canPublishCollegeWide: e.target.checked })} />
                )}</td>
                <td><button className="btn btn-outline" onClick={() => patch(u, { isActive: !u.isActive })}>{u.isActive ? "Active" : "Disabled"}</button></td>
                <td><button className="btn btn-danger" onClick={() => del(u)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
