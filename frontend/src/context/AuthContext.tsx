import { createContext, useContext, useState, ReactNode } from "react";
import { api, setTokens, clearTokens } from "../services/api";

interface User {
  user_id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string | null;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    setTokens(res.data.access_token, res.data.refresh_token);
    const me = await api.get("/auth/me");
    setUser(me.data);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
