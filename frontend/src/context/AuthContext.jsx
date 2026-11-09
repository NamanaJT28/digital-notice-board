import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On load, ask the server who we are (role always comes from the server)
  useEffect(() => {
    if (!localStorage.getItem("token")) return setLoading(false);
    api
      .get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password, role) => {
    const { data } = await api.post("/auth/login", { identifier, password, role });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
