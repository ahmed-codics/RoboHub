import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Briefcase, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface RoleSwitcherProps {
  userId: string;
  currentRole: string;
  onRoleChange: () => void;
}

const RoleSwitcher = ({ userId, currentRole, onRoleChange }: RoleSwitcherProps) => {
  const [loading, setLoading] = useState(false);

  const handleRoleSwitch = async (newRole: "freelancer" | "client") => {
    if (newRole === currentRole) return;

    setLoading(true);
    try {
      // First, delete ALL other roles (not the new one)
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .neq("role", newRole);

      if (deleteError) throw deleteError;

      // Then ensure the new role exists (insert if not exists)
      const { error: insertError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: newRole,
        }, {
          onConflict: "user_id,role",
          ignoreDuplicates: true
        });

      if (insertError) throw insertError;

      toast.success(`Switched to ${newRole} mode`);
      onRoleChange();
    } catch (error: any) {
      console.error("Error switching role:", error);
      toast.error("Failed to switch role. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={loading}>
          {currentRole === "freelancer" ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
          <span className="hidden sm:inline-block capitalize">{currentRole} Mode</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Account Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleRoleSwitch("freelancer")}
          disabled={loading || currentRole === "freelancer"}
          className="gap-2 cursor-pointer"
        >
          <Users className="h-4 w-4" />
          <span>Freelancer Mode</span>
          {currentRole === "freelancer" && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleRoleSwitch("client")}
          disabled={loading || currentRole === "client"}
          className="gap-2 cursor-pointer"
        >
          <Briefcase className="h-4 w-4" />
          <span>Client Mode</span>
          {currentRole === "client" && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default RoleSwitcher;
