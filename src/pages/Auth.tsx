import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bot, Mail, Lock, User, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";

import AppShell from "@/components/layout/AppShell";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signUpData, setSignUpData] = useState({ email: "", password: "", name: "" });
  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
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
                    <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-500">Forgot?</a>
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
                  By clicking Sign Up, you agree to our <a href="#" className="font-medium text-teal-600 hover:text-teal-500">Terms</a> and <a href="#" className="font-medium text-teal-600 hover:text-teal-500">Privacy Policy</a>.
                </div>
                <Button type="submit" className="w-full h-11 text-base font-medium text-white bg-teal-600 hover:bg-teal-700 shadow-sm border-0 rounded-md" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
};

export default Auth;
