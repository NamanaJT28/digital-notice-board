import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar({ children }) {
  const { user, logout } = useAuth();
  return (
    <header className="navbar">
      <div className="brand">
        <span className="logo">📋</span>
        <div>
          <strong>Digital Notice Board</strong>
          <small>{import.meta.env.VITE_COLLEGE_NAME || "College"}</small>
        </div>
      </div>
      <div className="nav-right">
        {children}
        <span className="user-chip">{user?.name} · {user?.role.toUpperCase()}</span>
        <button className="btn btn-outline" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
