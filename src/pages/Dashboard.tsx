import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Cpu, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import FreelancerDashboard from "@/components/dashboard/FreelancerDashboard";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import NotificationBell from "@/components/notifications/NotificationBell";
import RoleSwitcher from "@/components/RoleSwitcher";
import DashboardSidebar from "@/components/layout/DashboardSidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (roleError || !roleData) {
        toast.error("Failed to load user role");
        navigate("/auth");
        return;
      }
      setUserRole(roleData.role);
    } catch (error) {
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") navigate("/auth");
      else if (event === "SIGNED_IN" && session) checkUser();
    });
    return () => subscription.unsubscribe();
  }, [checkUser, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin text-primary"><Cpu className="h-12 w-12" /></div>
      </div>
    );
  }

  if (!userId || !userRole) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <DashboardSidebar
        userRole={userRole}
        onNavigate={(path) => navigate(path)}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area */}
      <div className="pl-64 transition-all duration-300">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search jobs, projects, or freelancers..."
                className="pl-10 bg-slate-100 dark:bg-slate-800 border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <RoleSwitcher userId={userId} currentRole={userRole} onRoleChange={checkUser} />
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>
            <NotificationBell userId={userId} />
          </div>
        </header>

        {/* Dashboard Views */}
        <main className="p-8">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome back, get ready for your next project.</p>
              </div>
              <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>

            {/* Dynamic Dashboard Content */}
            <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-1">
              {userRole === "freelancer" && <FreelancerDashboard userId={userId} />}
              {userRole === "client" && <ClientDashboard userId={userId} />}
              {userRole === "admin" && <div className="p-8 text-center">Admin details coming soon...</div>}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
