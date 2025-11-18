import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Cpu, Briefcase } from "lucide-react";
import { toast } from "sonner";
import FreelancerDashboard from "@/components/dashboard/FreelancerDashboard";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import NotificationBell from "@/components/notifications/NotificationBell";
import RoleSwitcher from "@/components/RoleSwitcher";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Don't redirect here - let the auth state listener handle it
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      // Get user role (handle multiple roles by taking the first one)
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .limit(1);

      if (roleError) {
        console.error("Error fetching user role:", roleError);
        toast.error("Failed to load user role");
        setLoading(false);
        return;
      }

      if (!roleData || roleData.length === 0) {
        toast.error("No role found. Please contact support.");
        setLoading(false);
        return;
      }

      setUserRole(roleData[0].role);
      setLoading(false);
    } catch (error) {
      console.error("Error checking user:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate("/auth");
      } else if (event === 'SIGNED_IN' && session) {
        checkUser();
      }
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
        <div className="animate-spin">
          <Cpu className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Cpu className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">RoboWork</span>
            </div>
            <Button 
              variant="ghost" 
              onClick={() => navigate("/jobs")}
              className="flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Browse Jobs
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {userId && <NotificationBell userId={userId} />}
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {userRole === "freelancer" && userId && <FreelancerDashboard userId={userId} />}
            {userRole === "client" && userId && <ClientDashboard userId={userId} />}
            {userRole === "admin" && <div>Admin Dashboard (Coming Soon)</div>}
          </div>
          <div className="lg:col-span-1">
            {userId && userRole && (
              <RoleSwitcher 
                userId={userId} 
                currentRole={userRole} 
                onRoleChange={checkUser} 
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
