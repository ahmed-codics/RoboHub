import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardShell from "@/components/layout/DashboardShell";
import ProfileSection from "@/components/dashboard/ProfileSection";
import ProfileImportPanel from "@/components/profile/ProfileImportPanel";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Cpu } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

const Profile = () => {
  const { user } = useAuth();
  const { userRole, refreshRole } = useUserRole();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
      } else {
        // Upsert fallback profile if missing
        const fallbackName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
        const { data: newProfile, error: upsertError } = await supabase
          .from("profiles")
          .upsert({ id: user.id, name: fallbackName })
          .select()
          .single();

        if (upsertError) throw upsertError;
        setProfile(newProfile);
      }
    } catch (error: unknown) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!user || !userRole) return null;

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Profile</h1>
          <p className="text-slate-600 mt-1">Manage your public profile and portfolio.</p>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 p-12 rounded-lg shadow-sm flex justify-center items-center">
            <Cpu className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <>
            <ProfileImportPanel userId={user.id} profile={profile} onApplied={loadProfile} />
            <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
              <ProfileSection 
                userId={user.id} 
                profile={profile} 
                onUpdate={loadProfile} 
              />
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
};

export default Profile;
