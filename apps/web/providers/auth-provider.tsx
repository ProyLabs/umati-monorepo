"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createGuest, getGuest } from "../lib/guest";
import { useLocalStorage } from "usehooks-ts"; // 👈 lightweight hook library

interface AuthUser {
  id: string;
  displayName?: string;
  avatar?: string;
  type: "guest" | "user";
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  updateUser: (displayName?: string, avatar?: string) => void;
  refresh: (displayName?: string, avatar?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  updateUser: ()=>{},
  refresh: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [storedUser, setStoredUser, removeStoredUser] =
    useLocalStorage<AuthUser | null>("umati_user", null);

  const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  async function init() {
    try {
      // No user stored → create new guest
      if (!storedUser) {
        const guest = await createGuest();
        setStoredUser({ ...guest, type: "guest" });
        return;
      }

      // User exists → verify guest exists on server
      const { id, displayName, avatar } = storedUser;
      const res = await getGuest(id);

      if (!res || res.error) {
        // Guest not found → recreate it with old name/avatar
        const newGuest = await createGuest(displayName, avatar);
        setStoredUser({ ...newGuest, type: "guest" });
      }
    } catch (err) {
      // If anything fails → recreate guest for safety
      const newGuest = await createGuest();
      setStoredUser({ ...newGuest, type: "guest" });
    } finally {
      setIsLoading(false);
    }
  }

  init();
  // ⚠️ Only run once after mount
  // storedUser must NOT be a dependency or it loops
}, []);



  const updateUser = (displayName?: string, avatar?: string) => {
    setStoredUser((prev) => {
      if (!prev) return prev;
      return { ...prev, displayName, avatar };
    });
  };

  const refresh = async (displayName?: string, avatar?: string) => {
    const guest = await createGuest(displayName, avatar);
    setStoredUser({ ...guest, type: "guest" });
  };

  const logout = () => {
    removeStoredUser();
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user: storedUser, isLoading, updateUser, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
