// src/pages/Auth.tsx  (or wherever you keep it)
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Cpu } from "lucide-react";

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Separate states for sign in and sign up (prevents cross-tab pollution)
  const [signinEmail, setSigninEmail] = useState("");
  const [signinPassword, setSigninPassword] = useState("");

  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"freelancer" | "client">("freelancer");

  useEffect(() => {
    // Check current session on mount
    let mounted = true;

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session && mounted) {
          navigate("/dashboard");
        }
      } catch (err) {
        // ignore: non-blocking
        console.error("getSession error:", err);
      }
    })();

    // Register auth state listener
    const authListener = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, etc.
      if (event === "SIGNED_IN" && session && mounted) {
        navigate("/dashboard");
      }
    });

    return () => {
      mounted = false;
      // unsubscribe safely (guarding for different shapes)
      try {
        // supabase.auth.onAuthStateChange returns { data: { subscription } }
        // but guard defensively:
        (authListener as any)?.data?.subscription?.unsubscribe?.();
      } catch (e) {
        // ignore unsubscribe errors
      }
    };
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic validation
      if (!signupEmail || !signupPassword || !name) {
        toast.error("All fields are required");
        return;
      }

      if (signupPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          // include redirect after email confirmation if you want
          emailRedirectTo: `${window.location.origin}/dashboard`,
          // note: Supabase supports options.data as sign-up metadata (raw_user_meta_data)
          // but it's still recommended to keep canonical user profile data in your own table.
          data: { name, role },
        },
      });

      if (error) throw error;

      // If a user object is returned, persist canonical profile/role/plan in your DB
      const userId = (data as any)?.user?.id;
      const hasSession = (data as any)?.session;

      if (userId) {
        // insert user profile / role / plan and await them to avoid race conditions
        const profileInsert = await supabase
          .from("profiles")
          .upsert({ id: userId, email: signupEmail, name, role }, { returning: "minimal" });

        if (profileInsert.error) {
          console.error("Error upserting profile:", profileInsert.error);
          toast.error("Failed to create user profile. Please contact support.");
          // continue — user might still confirm email and be able to login later
        }

        const roleInsert = await supabase
          .from("user_roles")
          .insert([{ user_id: userId, role }], { returning: "minimal" });

        if (roleInsert.error) {
          // avoid failing the whole flow — but surface
          console.error("Error creating user role:", roleInsert.error);
        }

        const planInsert = await supabase
          .from("premium_plans")
          .insert([{ user_id: userId, plan_type: "free", extra_bids: 0 }], { returning: "minimal" });

        if (planInsert.error) {
          console.error("Error creating premium plan:", planInsert.error);
        }
      }

      // If the project requires email confirmation, signUp may return user with no session.
      if (hasSession) {
        toast.success("Account created and signed in!");
        // navigation will be handled by auth listener, but we can optionally navigate now:
        navigate("/dashboard");
      } else {
        toast.success("Account created! Check your email to confirm your account.");
      }
    } catch (err: any) {
      // Provide clearer messages for common errors
      const message = err?.message ?? "Failed to sign up";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signinEmail,
        password: signinPassword,
      });

      if (error) throw error;

      // If signed in immediately, redirect now (auth listener will also handle it)
      if (data?.session) {
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      } else {
        // Some projects may require email confirmation; inform the user
        toast.success("Check your email if your account requires confirmation.");
      }
    } catch (err: any) {
      const message = err?.message ?? "Failed to sign in";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Cpu className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to RoboWork</CardTitle>
          <CardDescription>Sign in to your account or create a new one to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label>I want to</Label>
                  <RadioGroup value={role} onValueChange={(value) => setRole(value as "freelancer" | "client")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="freelancer" id="freelancer" />
                      <Label htmlFor="freelancer" className="font-normal cursor-pointer">
                        Work as a Freelancer
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="font-normal cursor-pointer">
                        Hire Talent
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
