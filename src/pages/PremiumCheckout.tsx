import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Lock, Zap, ArrowLeft } from "lucide-react";
import AppShell from "@/components/layout/AppShell";

const PremiumCheckout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const premiumFeatures = [
    "Unlimited monthly bids",
    "Priority support",
    "Featured profile placement",
    "Advanced analytics dashboard",
    "Direct messaging with clients",
    "Early access to new features"
  ];

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to continue");
        navigate("/auth");
        return;
      }

      // Call Edge Function to create Paymob Order
      const { data, error } = await supabase.functions.invoke('create-paymob-payment', {
        body: {
          amount: 1, // Temporarily set to 1 EGP for testing
          payment_type: 'subscription'
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.success && data?.payment_url) {
        toast.success("Redirecting to secure payment gateway...");
        // Redirect to Paymob iframe (or dummy test page)
        window.location.href = data.payment_url;
      } else {
        throw new Error("Failed to generate payment URL");
      }

    } catch (error: unknown) {
      console.error("Payment error:", error);
      toast.error("Payment failed", {
        description: (error as Error).message || "Please try again or contact support"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12 px-4">
        <div className="max-w-4xl mx-auto animate-fade-in-up">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-6 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Plan Details */}
            <div className="space-y-6">
              <Card className="h-full border border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold text-slate-900">Premium Plan (Test)</CardTitle>
                    <Badge variant="default" className="gap-1 bg-teal-100 text-teal-800 hover:bg-teal-200 border-0">
                      <Zap className="h-3 w-3" />
                      Test Value
                    </Badge>
                  </div>
                  <CardDescription className="text-slate-500">
                    Test 1 EGP transaction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900">1 EGP</span>
                    <span className="text-slate-500 font-medium">/test</span>
                  </div>

                  <Separator className="bg-slate-100" />

                  <div className="space-y-3">
                    <p className="font-semibold text-sm text-slate-900">What's included:</p>
                    {premiumFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-teal-600" />
                        </div>
                        <span className="text-sm text-slate-600 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Separator className="bg-slate-100" />

                  <div className="bg-slate-50 p-4 rounded-md space-y-2 border border-slate-100">
                    <p className="text-sm font-bold text-slate-900">Test Environment</p>
                    <p className="text-xs text-slate-500 font-medium">
                      This is connected to your sandbox server. No real money will be charged.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Checkout Action */}
            <div className="flex flex-col justify-center space-y-6">
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-900">Secure Checkout</CardTitle>
                  <CardDescription className="text-slate-500">Proceed with Paymob Payment Gateway</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-teal-50 border border-teal-100 rounded-md flex gap-3 text-sm text-teal-800">
                    <Lock className="h-5 w-5 flex-shrink-0" />
                    <p className="font-medium">You will be redirected to Paymob's secure payment page to complete your transaction. No card details are stored on our servers.</p>
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex justify-between font-bold text-lg text-slate-900">
                      <span>Total Due</span>
                      <span>1 EGP</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full h-12 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm border-0 rounded-md font-medium"
                    onClick={handleCheckout}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Proceed to Payment"}
                  </Button>
                </CardFooter>
              </Card>

              <div className="text-center">
                <p className="text-xs font-medium text-slate-400">Powered by Paymob Solutions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default PremiumCheckout;
