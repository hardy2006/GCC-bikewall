import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { apiFetch } from "../lib/api";

interface User {
  id: number;
  username: string;
  role: "customer" | "technician" | "operator";
  phone?: string;
  realName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (params: {
    username: string;
    password: string;
    role: string;
    phone?: string;
    realName?: string;
  }) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function readAuth(): AuthState {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  if (token && userStr) {
    try {
      return { token, user: JSON.parse(userStr) as User };
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }
  return { user: null, token: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(readAuth);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiFetch<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
    return data.user;
  }, []);

  const register = useCallback(async (params: {
    username: string;
    password: string;
    role: string;
    phone?: string;
    realName?: string;
  }) => {
    const data = await apiFetch<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(params),
    });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ user: null, token: null });
  }, []);

  return (
    <AuthContext.Provider value={{
      ...auth,
      isLoggedIn: !!auth.token,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}