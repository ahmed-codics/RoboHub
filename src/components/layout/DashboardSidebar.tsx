import {
    LayoutDashboard,
    Briefcase,
    Settings,
    LogOut,
    MessageSquare,
    Bell,
    CreditCard,
    User,
    Bot,
    BarChart3,
    Package,
    Heart,
    ShieldAlert
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
        { icon: Package, label: "Services", path: "/services", roles: ["all"] },
        { icon: MessageSquare, label: "Messages", path: "/messages", roles: ["all"] },
        { icon: BarChart3, label: "Analytics", path: "/analytics", roles: ["all"] },
        { icon: CreditCard, label: "Payments", path: "/payments", roles: ["all"] },
        { icon: Heart, label: "Saved", path: "/saved", roles: ["all"] },
        { icon: ShieldAlert, label: "Disputes", path: "/disputes", roles: ["all"] },
        { icon: User, label: "Profile", path: "/profile", roles: ["all"] },
        { icon: Settings, label: "Settings", path: "/settings", roles: ["all"] },
    ];

    return (
        <div className="h-screen w-64 bg-white text-slate-800 flex flex-col border-r border-slate-200 fixed left-0 top-0 z-40">
            {/* Brand */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
                <span className="grid h-8 w-8 place-items-center rounded bg-teal-600 text-white">
                    <Bot className="h-5 w-5" />
                </span>
                <span className="text-xl font-bold tracking-tight text-slate-900">RemoteRobotics</span>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Menu</div>
                {menuItems.map((item) => (
                    <Button
                        key={item.path}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 h-10 text-slate-600 hover:text-teal-600 hover:bg-slate-50 transition-colors font-medium rounded-md",
                            activePath === item.path && "bg-teal-50 text-teal-700 hover:bg-teal-100"
                        )}
                        onClick={() => onNavigate(item.path)}
                    >
                        <item.icon className={cn("h-4 w-4", activePath === item.path ? "text-teal-600" : "text-slate-400")} />
                        <span>{item.label}</span>
                    </Button>
                ))}
            </div>

            {/* User Info / Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                        <User className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate text-slate-900">My Account</p>
                        <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    className="w-full bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium rounded-md shadow-sm h-9"
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
