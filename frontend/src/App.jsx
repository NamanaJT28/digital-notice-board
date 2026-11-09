import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import TeacherDashboard from "./pages/TeacherDashboard.jsx";
import HodDashboard from "./pages/HodDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const HOME = { student: "/student", teacher: "/teacher", hod: "/hod", admin: "/admin" };

function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME[user.role]} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={HOME[user.role]} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={HOME[user.role]} /> : <Register />} />
      <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
      <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
      <Route path="/hod" element={<Protected role="hod"><HodDashboard /></Protected>} />
      <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
      <Route path="*" element={<Navigate to={user ? HOME[user.role] : "/login"} replace />} />
    </Routes>
  );
}
