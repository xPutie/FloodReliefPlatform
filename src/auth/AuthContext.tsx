import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { SessionState, UserProfile } from "./auth-types";

interface AuthContextType {
  session: SessionState;
  token: string | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType>({
  session: {
    isAuthenticated: false,
    user: null,
    loading: true,
    status: "UNAUTHENTICATED",
  },
  token: null,
  login: async () => { throw new Error("AuthContext not initialized"); },
  logout: () => {},
  getAuthHeaders: () => ({}),
});

const API_BASE = "http://localhost:3000";
const TOKEN_KEY = "flood_rescue_access_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });

  const [session, setSession] = useState<SessionState>({
    isAuthenticated: false,
    user: null,
    loading: true,
    status: "UNAUTHENTICATED",
  });

  // Restore session from token on mount or token change
  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setSession({
          isAuthenticated: false,
          user: null,
          loading: false,
          status: "UNAUTHENTICATED",
        });
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const user: UserProfile = await res.json();
          setSession({
            isAuthenticated: true,
            user,
            loading: false,
            status: "AUTHENTICATED",
          });
        } else {
          // Token expired or invalid
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setSession({
            isAuthenticated: false,
            user: null,
            loading: false,
            status: "EXPIRED",
          });
        }
      } catch (err) {
        console.error("Lỗi xác thực phiên làm việc:", err);
        setSession({
          isAuthenticated: false,
          user: null,
          loading: false,
          status: "UNAUTHENTICATED",
        });
      }
    }

    restoreSession();
  }, [token]);

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Email hoặc mật khẩu không chính xác.");
    }

    const data = await res.json();
    const newToken = data.accessToken;
    const user: UserProfile = data.user;

    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setSession({
      isAuthenticated: true,
      user,
      loading: false,
      status: "AUTHENTICATED",
    });

    return user;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setSession({
      isAuthenticated: false,
      user: null,
      loading: false,
      status: "UNAUTHENTICATED",
    });
  };

  const getAuthHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        token,
        login,
        logout,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
