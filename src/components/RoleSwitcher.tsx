import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase } from "lucide-react";
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
      // Check if user already has this role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .eq("role", newRole)
        .single();

      // If role doesn't exist, create it
      if (!existingRole) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: newRole,
          });

        if (insertError) throw insertError;
      }

      // Update the current role (delete old, keep new)
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", currentRole as "freelancer" | "client");

      if (deleteError) throw deleteError;

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Account Type
        </CardTitle>
        <CardDescription>
          Switch between freelancer and client modes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant={currentRole === "freelancer" ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => handleRoleSwitch("freelancer")}
          disabled={loading || currentRole === "freelancer"}
        >
          <Users className="h-4 w-4 mr-2" />
          Freelancer Mode
          {currentRole === "freelancer" && (
            <Badge variant="secondary" className="ml-auto">Active</Badge>
          )}
        </Button>

        <Button
          variant={currentRole === "client" ? "default" : "outline"}
          className="w-full justify-start"
          onClick={() => handleRoleSwitch("client")}
          disabled={loading || currentRole === "client"}
        >
          <Briefcase className="h-4 w-4 mr-2" />
          Client Mode
          {currentRole === "client" && (
            <Badge variant="secondary" className="ml-auto">Active</Badge>
          )}
        </Button>

        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            {currentRole === "freelancer" 
              ? "Switch to Client mode to post jobs and hire freelancers"
              : "Switch to Freelancer mode to bid on jobs and showcase your skills"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleSwitcher;
