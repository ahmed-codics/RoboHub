import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bot, Mail, Lock, User, ArrowRight, CheckCircle2, Eye, EyeOff, Github, Linkedin } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signUpData, setSignUpData] = useState({ email: "", password: "", name: "" });
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleOAuth = async (provider: "google" | "github" | "linkedin_oidc") => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}dashboard` },
      });
      if (error) throw error;
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to start sign-in");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent. Check your email.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to send reset link");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}dashboard`,
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: authData.user.id,
          name: signUpData.name,
        });
        if (profileError) throw profileError;

        const { error: roleError } = await supabase.from("user_roles").upsert({
          user_id: authData.user.id,
          role: "freelancer",
        });
        if (roleError) throw roleError;

        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Signed in successfully!");
        setTimeout(() => navigate("/dashboard"), 100);
      }
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="flex justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-sm border border-slate-200">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
            <p className="mt-2 text-slate-500">Enter your credentials to access your dashboard.</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 p-1 rounded-md">
              <TabsTrigger value="signin" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all font-medium">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-sm data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm transition-all font-medium">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setForgotEmail(signInData.email); setForgotOpen(true); }}
                      className="text-sm font-medium text-teal-600 hover:text-teal-500"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-12 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword((value) => !value)}
                      className="absolute right-3 top-2.5 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={showSignInPassword ? "Hide password" : "Show password"}
                    >
                      {showSignInPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm border-0 rounded-md" disabled={loading}>
                  {loading ? "Authenticating..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      className="pl-10 pr-12 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword((value) => !value)}
                      className="absolute right-3 top-2.5 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                    >
                      {showSignUpPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-500 text-center">
                  By clicking Sign Up, you agree to our <a href="/terms" className="font-medium text-teal-600 hover:text-teal-500">Terms</a> and <a href="/privacy" className="font-medium text-teal-600 hover:text-teal-500">Privacy Policy</a>.
                </div>
                <Button type="submit" className="w-full h-11 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm border-0 rounded-md" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400">Or continue with</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Button type="button" variant="outline" onClick={() => handleOAuth("google")} className="h-11 border-slate-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOAuth("github")} className="h-11 border-slate-200">
                <Github className="h-5 w-5 text-slate-800" />
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOAuth("linkedin_oidc")} className="h-11 border-slate-200">
                <Linkedin className="h-5 w-5 text-[#0A66C2]" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your account email and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@company.com"
                  className="pl-10 h-11 border-slate-200 focus:border-teal-500 focus:ring-teal-500 rounded-md"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 text-white bg-teal-600 hover:bg-teal-700 rounded-md" disabled={forgotLoading}>
              {forgotLoading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default Auth;
