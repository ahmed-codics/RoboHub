import {
    LayoutDashboard,
    Briefcase,
    Settings,
    LogOut,
    MessageSquare,
    Bell,
    CreditCard,
    User,
    Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
    userRole: string | null;
    activePath?: string;
    onNavigate: (path: string) => void;
    onSignOut: () => void;
}

const DashboardSidebar = ({ userRole, activePath = "/dashboard", onNavigate, onSignOut }: SidebarProps) => {
    const menuItems = [
        { icon: LayoutDashboard, label: "Overview", path: "/dashboard", roles: ["all"] },
        { icon: Briefcase, label: "Jobs", path: "/jobs", roles: ["all"] },
        { icon: MessageSquare, label: "Messages", path: "/messages", roles: ["all"] },
        { icon: CreditCard, label: "Payments", path: "/payments", roles: ["all"] },
        { icon: User, label: "Profile", path: "/profile", roles: ["all"] },
        { icon: Settings, label: "Settings", path: "/settings", roles: ["all"] },
    ];

    return (
        <div className="h-screen w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 fixed left-0 top-0">
            {/* Brand */}
            <div className="p-6 flex items-center gap-3 border-b border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
                    <Cpu className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight">RoboWork</span>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menu</div>
                {menuItems.map((item) => (
                    <Button
                        key={item.path}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-12 text-slate-300 hover:text-white hover:bg-white/5 transition-all",
                            activePath === item.path && "bg-primary/10 text-primary hover:bg-primary/20 border-r-2 border-primary rounded-r-none"
                        )}
                        onClick={() => onNavigate(item.path)}
                    >
                        <item.icon className={cn("h-5 w-5", activePath === item.path ? "text-primary" : "text-slate-400")} />
                        <span className="font-medium">{item.label}</span>
                    </Button>
                ))}
            </div>

            {/* User Info / Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate text-white">My Account</p>
                        <p className="text-xs text-slate-400 capitalize">{userRole}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full border-slate-700 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 transition-colors"
                    onClick={onSignOut}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
};

export default DashboardSidebar;
