import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import FreelancerDashboard from "@/components/dashboard/FreelancerDashboard";
import ClientDashboard from "@/components/dashboard/ClientDashboard";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { userRole, roleLoading, roleError, refreshRole } = useUserRole();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin text-primary"><Cpu className="h-12 w-12" /></div>
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Cpu className="mx-auto mb-4 h-10 w-10 text-teal-500" />
          <h1 className="text-2xl font-extrabold text-slate-900">Failed to load dashboard</h1>
          <p className="mt-2 text-slate-600">We could not load your dashboard role. Try again or log out and sign back in.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={refreshRole} className="bg-teal-500 hover:bg-teal-600">
              Try Again
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Log Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !userRole) return null;

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-600 mt-1">Welcome back, get ready for your next project.</p>
          </div>
          <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-md border border-slate-200 shadow-sm">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Dynamic Dashboard Content */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6">
          {userRole === "freelancer" && <FreelancerDashboard userId={user.id} />}
          {userRole === "client" && <ClientDashboard userId={user.id} />}
          {userRole === "admin" && <div className="p-8 text-center text-slate-500">Admin details coming soon...</div>}
        </div>
      </div>
    </DashboardShell>
  );
};

export default Dashboard;
