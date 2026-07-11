import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase establishes a recovery session from the URL hash on load.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. Please sign in.");
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex justify-center py-12 px-4 bg-slate-50 min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-lg shadow-sm border border-slate-200 h-fit">
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-teal-50">
              <ShieldCheck className="h-6 w-6 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set a new password</h1>
            <p className="mt-2 text-slate-500">Choose a strong password for your account.</p>
          </div>

          {!ready ? (
            <p className="text-center text-sm text-slate-500">
              Open this page from the reset link in your email. If you got here by mistake,{" "}
              <button className="text-teal-600 hover:underline" onClick={() => navigate("/auth")}>go to sign in</button>.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="new-password"
                    type={show ? "text" : "password"}
                    className="pl-10 pr-12 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-2.5 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type={show ? "text" : "password"}
                    className="pl-10 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 text-white bg-teal-600 hover:bg-teal-700 rounded-md" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default ResetPassword;
