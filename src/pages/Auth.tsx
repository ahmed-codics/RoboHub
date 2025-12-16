import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Cpu, Mail, Lock, User, ArrowRight, CheckCircle2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signUpData, setSignUpData] = useState({ email: "", password: "", name: "" });
  const [signInData, setSignInData] = useState({ email: "", password: "" });

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
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          name: signUpData.name,
        });
        if (profileError) throw profileError;

        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "freelancer",
        });
        if (roleError) throw roleError;

        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to sign up");
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
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Interactive Visuals */}
      <div className="hidden lg:flex relative bg-slate-900 overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-slate-900/90 backdrop-blur-[1px]"></div>

        {/* Decorative circles */}
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[100px] animate-pulse-glow"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            <Cpu className="h-10 w-10 text-primary" />
            RemoteRobotics
          </div>
          <p className="mt-4 text-slate-300 text-lg max-w-md leading-relaxed">
            The premier marketplace connecting world-class robotics engineers with visionary companies.
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            {[
              "Vetted Robotics Experts",
              "Secure Payments & Escrow",
              "ROS, OpenCV & AI Projects"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="p-1 rounded-full bg-primary/20 border border-primary/30">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium text-lg">{item}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="p-6 glass-card rounded-2xl border-l-4 border-l-primary max-w-lg">
              <p className="text-slate-300 italic">"This platform transformed how we hire for our drone swarm projects. The talent quality is unmatched."</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                <div>
                  <p className="font-bold text-white">Sarah Chen</p>
                  <p className="text-sm text-slate-400">CTO, DroneDynamics</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          © 2024 RemoteRobotics Inc.
        </div>
      </div>

      {/* Right: Auth Form */}
      <div className="flex items-center justify-center bg-background p-6 lg:p-12 relative">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none dark:bg-grid-slate-800/20"></div>

        <div className="w-full max-w-md space-y-8 relative z-10 animate-slide-up">
          <div className="text-center lg:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Welcome Back</h1>
            <p className="mt-2 text-muted-foreground">Enter your credentials to access your dashboard.</p>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md transition-all">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-6">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10 h-11 glass-input"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="signin-password">Password</Label>
                    <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10 h-11 glass-input"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-primary/20 transition-all duration-300" disabled={loading}>
                  {loading ? "Authenticating..." : "Sign In"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-6">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10 h-11 glass-input"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="name@company.com"
                      className="pl-10 h-11 glass-input"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a strong password"
                      className="pl-10 h-11 glass-input"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  By clicking Sign Up, you agree to our <a href="#" className="underline">Terms</a> and <a href="#" className="underline">Privacy Policy</a>.
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg hover:shadow-primary/20 transition-all duration-300" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
