"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type User = {
  steamId: string;
  username: string;
  avatar: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  adminMode: boolean;
  setAdminMode: (enabled: boolean) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("🔥🔥 AUTH PROVIDER IS RUNNING");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminMode, setAdminModeState] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("asrt_admin_mode");
      if (savedMode !== null) {
        setAdminModeState(savedMode === "true");
      }
    }
  }, []);

  const setAdminMode = (enabled: boolean) => {
    const isBool = Boolean(enabled);
    setAdminModeState(isBool);
    if (typeof window !== "undefined") {
      localStorage.setItem("asrt_admin_mode", String(isBool));
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (!API_URL) {
          throw new Error("NEXT_PUBLIC_API_URL is not configured");
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          return;
        }

        const data = await response.json();

        console.log("Authenticated user:", data.user);

        setUser(data.user);
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const logout = async () => {
    try {
      if (API_URL) {
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
    } catch (error) {
      console.error("Failed to call logout API:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("asrt_admin_mode");
      }
      setUser(null);
      setAdminModeState(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        adminMode,
        setAdminMode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}