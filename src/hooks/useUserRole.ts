import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const ROLE_TIMEOUT_MS = 8000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roleLoading, setRoleLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);

  const checkUserRole = useCallback(async () => {
    if (!user) {
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    setRoleError(null);

    try {
      const { data: roleData, error: fetchError } = await withTimeout(
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle(),
        ROLE_TIMEOUT_MS,
        "Role lookup",
      );

      if (fetchError) throw fetchError;

      if (roleData?.role) {
        setUserRole(roleData.role);
        return;
      }

      const { data: createdRole, error: createError } = await withTimeout(
        supabase
          .from("user_roles")
          .upsert({ user_id: user.id, role: "freelancer" })
          .select("role")
          .single(),
        ROLE_TIMEOUT_MS,
        "Default role creation",
      );

      if (createError) throw createError;
      setUserRole(createdRole?.role || "freelancer");
    } catch (error) {
      console.error("Failed to load user role:", error);
      setUserRole(null);
      setRoleError("Failed to load dashboard data");
      toast.error("Failed to load user data");
    } finally {
      setRoleLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoleLoading(false);
      return;
    }
    checkUserRole();
  }, [user, authLoading, checkUserRole]);

  return {
    userRole,
    roleLoading: authLoading || roleLoading,
    roleError,
    refreshRole: checkUserRole,
    user
  };
};
