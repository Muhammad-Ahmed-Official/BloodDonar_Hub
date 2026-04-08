import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginUser, signUpUser, verifyEmail as verifyEmailService, logoutUser } from "../services/auth.service";
import { saveToken, saveUser, getToken, getSavedUser, clearSession } from "../storage/tokenStorage";
import { connectRealtime, disconnectRealtime } from "@/services/realtime";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  _id: string;
  userName: string;
  email: string;
  role: "user" | "admin";
  isVerified: boolean;
  suspended: boolean;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userName: string, email: string, password: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on app launch ──────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getToken(), getSavedUser()]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch {
        await clearSession();
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // ── Realtime socket lifecycle ──────────────────────────────────────────────
  useEffect(() => {
    if (user?._id && token) {
      connectRealtime(String(user._id));
    } else {
      disconnectRealtime();
    }
  }, [user?._id, token]);

  // Ensure cleanup only on provider unmount (avoid dev-mode reconnect loops)
  useEffect(() => {
    return () => {
      disconnectRealtime();
    };
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const response = await loginUser({ email, password });
    const { user: loggedInUser, accessToken } = response.data;
    await Promise.all([saveToken(accessToken), saveUser(loggedInUser)]);
    setToken(accessToken);
    setUser(loggedInUser);
    // Route guard redirects based on role + isVerified
  }, []);

  // ── Signup ─────────────────────────────────────────────────────────────────
  // Stores token immediately so verify-email (JWT-protected) works.
  // user.isVerified = false → route guard redirects to verification screen.
  const signup = useCallback(async (userName: string, email: string, password: string) => {
    const response = await signUpUser({ userName, email, password });
    const { user: createdUser, accessToken } = response.data;
    await Promise.all([saveToken(accessToken), saveUser(createdUser)]);
    setToken(accessToken);
    setUser(createdUser);
  }, []);

  // ── Verify OTP ─────────────────────────────────────────────────────────────
  // Token is already in storage so the interceptor attaches it automatically.
  const verifyOtp = useCallback(async (otp: string) => {
    await verifyEmailService({ otp });
    // Patch local user — avoid a full profile refetch
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, isVerified: true };
      saveUser(updated); // async, fire-and-forget
      return updated;
    });
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    logoutUser(); // notify server (fire-and-forget)
    disconnectRealtime();
    await clearSession();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        signup,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
