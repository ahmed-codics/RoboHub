import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Cpu } from "lucide-react";
import { toast } from "sonner";
import FreelancerDashboard from "@/components/dashboard/FreelancerDashboard";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import NotificationBell from "@/components/notifications/NotificationBell";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUserId(session.user.id);

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roleError) {
        console.error("Error fetching user role:", roleError);
        toast.error("Failed to load user role");
        return;
      }

      setUserRole(roleData.role);
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <div className="flex items-center gap-2">
            <Cpu className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">RoboWork</span>
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
        {userRole === "freelancer" && userId && <FreelancerDashboard userId={userId} />}
        {userRole === "client" && userId && <ClientDashboard userId={userId} />}
        {userRole === "admin" && <div>Admin Dashboard (Coming Soon)</div>}
      </main>
    </div>
  );
};

export default Dashboard;
