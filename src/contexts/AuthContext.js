"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { logoutUser, refreshToken } from "@/services/authService";

const AuthContext = createContext();

// Helper: decode JWT and return ms left until expiry
const getMsLeft = (token) => {
  try {
    const { exp } = JSON.parse(atob(token.split(".")[1]));
    return exp * 1000 - Date.now();
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 1. Proactive refresh loop (runs every 30s)
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = sessionStorage.getItem("accessToken");
      if (!token) return;

      const msLeft = getMsLeft(token);
      if (msLeft !== null && msLeft < 120000) {
        await refreshToken();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // 2. Resume-from-sleep/lock/mobile minimize refresh
  useEffect(() => {
    const onResume = async () => {
      const token = sessionStorage.getItem("accessToken");
      if (!token) return;

      const msLeft = getMsLeft(token);
      if (msLeft !== null && msLeft < 120000) {
        await refreshToken();
      }
    };

    // Covers desktop tab changes + window focus
    window.addEventListener("visibilitychange", onResume);
    window.addEventListener("focus", onResume);

    // Covers mobile browsers (iOS Safari / Android Chrome) when app is minimized
    window.addEventListener("pageshow", onResume);

    return () => {
      window.removeEventListener("visibilitychange", onResume);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("pageshow", onResume);
    };
  }, []);

  const handleSetUser = (userData) => {
    if (userData) {
      sessionStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.removeItem("user");
    }
    setUser(userData);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      handleSetUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser: handleSetUser, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
