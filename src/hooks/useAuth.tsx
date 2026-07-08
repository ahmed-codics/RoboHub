import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthChangeEvent, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const AUTH_TIMEOUT_MS = 8000;

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<User | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data, error } = await withTimeout(
        supabase.auth.getUser(),
        AUTH_TIMEOUT_MS,
        "Auth verification",
      );

      if (error) throw error;
      setUser(data.user ?? null);
      return data.user ?? null;
    } catch (error) {
      console.error("Failed to verify auth user:", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadInitialUser = async () => {
      setLoading(true);
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getUser(),
          AUTH_TIMEOUT_MS,
          "Initial auth verification",
        );

        if (!mounted) return;
        if (error) throw error;
        setUser(data.user ?? null);
      } catch (error) {
        if (!mounted) return;
        console.error("Initial auth verification failed:", error);
        setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        setLoading(false);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setLoading(true);
        refreshUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.signOut(),
        AUTH_TIMEOUT_MS,
        "Sign out",
      );
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error("Failed to sign out:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    refreshUser,
    signOut,
  }), [loading, refreshUser, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return value;
};
