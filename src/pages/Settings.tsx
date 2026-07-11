import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import DashboardShell from "@/components/layout/DashboardShell";
import RoleSwitcher from "@/components/RoleSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Cpu, LogOut } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { userRole, refreshRole } = useUserRole();
  const [profileName, setProfileName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    marketing_emails: false,
    bid_alerts: true,
    message_alerts: true,
  });

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notification_preferences")
      .select("email_notifications, marketing_emails, bid_alerts, message_alerts")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setPrefs(data);
  }, [user]);

  const savePref = async (key: keyof typeof prefs, value: boolean) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() });
    if (error) {
      toast.error("Failed to save preference");
      setPrefs(prefs);
    } else {
      toast.success("Preference saved");
    }
  };

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        setProfileName(data.name);
      } else {
        setProfileName(user.user_metadata?.full_name || user.email?.split("@")[0] || "User");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
    loadPrefs();
  }, [loadProfile, loadPrefs]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (!user || !userRole) return null;

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="space-y-8 max-w-3xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your account preferences and security.</p>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 p-12 rounded-lg shadow-sm flex justify-center items-center">
            <Cpu className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Basics */}
            <Card>
              <CardHeader>
                <CardTitle>Account Basics</CardTitle>
                <CardDescription>
                  Your core account information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Your email address cannot be changed.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input id="name" value={profileName} disabled />
                  <p className="text-xs text-muted-foreground">You can change your display name in your <a href="/profile" className="text-teal-600 hover:underline">Profile</a>.</p>
                </div>
                <div className="pt-2">
                  <Label className="mb-2 block">Account Role</Label>
                  <div className="inline-block">
                    <RoleSwitcher userId={user.id} currentRole={userRole} onRoleChange={refreshRole} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Switch between freelancer and client views.</p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Manage how we contact you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive emails about your account activity.</p>
                  </div>
                  <Switch checked={prefs.email_notifications} onCheckedChange={(v) => savePref("email_notifications", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Bid Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a freelancer bids on your job.</p>
                  </div>
                  <Switch checked={prefs.bid_alerts} onCheckedChange={(v) => savePref("bid_alerts", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Message Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified about new messages.</p>
                  </div>
                  <Switch checked={prefs.message_alerts} onCheckedChange={(v) => savePref("message_alerts", v)} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive emails about new features and offers.</p>
                  </div>
                  <Switch checked={prefs.marketing_emails} onCheckedChange={(v) => savePref("marketing_emails", v)} />
                </div>
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>
                  Manage your account security and sessions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="pt-2">
                  <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

export default Settings;
