import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, setTokens, clearTokens, getStoredRefreshToken } from "../services/api";

interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
  avatar_url: string | null;
  tenant_id: string | null;
  email_verified?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: (accessToken: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(!!getStoredRefreshToken());

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setRestoring(false); return; }
    api.get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => clearTokens())
      .finally(() => setRestoring(false));
  }, []);

  async function login(email: string, password: string): Promise<User> {
    const res = await api.post("/auth/login", { email, password });
    setTokens(res.data.access_token, res.data.refresh_token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }

  async function loginWithGoogle(accessToken: string): Promise<User> {
    const res = await api.post("/auth/google", { access_token: accessToken });
    setTokens(res.data.access_token, res.data.refresh_token);
    const me = await api.get("/auth/me");
    setUser(me.data);
    return me.data;
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  if (restoring) return null;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
