import { ReactNode } from "react";
import { Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardSidebar from "./DashboardSidebar";
import NotificationBell from "@/components/notifications/NotificationBell";
import RoleSwitcher from "@/components/RoleSwitcher";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface DashboardShellProps {
  children: ReactNode;
  userRole: string | null;
  onRoleChange: () => void;
}

const DashboardShell = ({ children, userRole, onRoleChange }: DashboardShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 relative flex font-sans">
      <DashboardSidebar
        userRole={userRole}
        activePath={location.pathname}
        onNavigate={(path) => navigate(path)}
        onSignOut={handleSignOut}
      />

      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-slate-50 border border-slate-200 focus-visible:ring-1 focus-visible:ring-teal-500 rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {userRole && <RoleSwitcher userId={user.id} currentRole={userRole} onRoleChange={onRoleChange} />}
            <div className="h-6 w-px bg-slate-200"></div>
            <NotificationBell userId={user.id} />
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
