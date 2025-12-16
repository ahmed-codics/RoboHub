import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, CreditCard, Zap, ArrowLeft, Lock } from "lucide-react";

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
          amount: 10, // $10 or 10 EGP depending on currency settings
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

    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error("Payment failed", {
        description: error.message || "Please try again or contact support"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Details */}
          <div className="space-y-6">
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  <Badge variant="default" className="gap-1 bg-primary">
                    <Zap className="h-3 w-3" />
                    Best Value
                  </Badge>
                </div>
                <CardDescription>
                  Unlock unlimited opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">$10</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="font-semibold text-sm">What's included:</p>
                  {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Money-back guarantee</p>
                  <p className="text-xs text-muted-foreground">
                    Not satisfied? Get a full refund within 30 days, no questions asked.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Checkout Action */}
          <div className="flex flex-col justify-center space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Secure Checkout</CardTitle>
                <CardDescription>Proceed with Paymob Payment Gateway</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                  <Lock className="h-5 w-5 flex-shrink-0" />
                  <p>You will be redirected to Paymob's secure payment page to complete your transaction. No card details are stored on our servers.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Due</span>
                    <span>$10.00</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full h-12 text-lg"
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </CardFooter>
            </Card>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">Powered by Paymob Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumCheckout;
