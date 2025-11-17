import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, CreditCard, Lock, Zap, ArrowLeft } from "lucide-react";
import { z } from "zod";

const paymentSchema = z.object({
  cardName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  cardNumber: z.string().trim().regex(/^\d{16}$/, "Card number must be 16 digits"),
  cardExpiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Expiry must be in MM/YY format"),
  cardCvc: z.string().trim().regex(/^\d{3,4}$/, "CVC must be 3 or 4 digits")
});

const PremiumCheckout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const premiumFeatures = [
    "Unlimited monthly bids",
    "Priority support",
    "Featured profile placement",
    "Advanced analytics dashboard",
    "Direct messaging with clients",
    "Early access to new features"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = paymentSchema.parse({
        cardName,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpiry,
        cardCvc,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to continue");
        navigate("/auth");
        return;
      }

      // Simulate payment processing (in production, integrate with Stripe or similar)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Calculate active until date (1 month from now)
      const activeUntil = new Date();
      activeUntil.setMonth(activeUntil.getMonth() + 1);

      // Update premium plan
      const { error: planError } = await supabase
        .from("premium_plans")
        .upsert({
          user_id: user.id,
          plan_type: "premium",
          price: 10,
          active_until: activeUntil.toISOString(),
          extra_bids: 0,
        });

      if (planError) throw planError;

      // Record payment
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: 10,
          type: "premium_subscription",
          status: "completed",
          metadata: { plan: "premium", duration: "monthly" }
        });

      if (paymentError) throw paymentError;

      toast.success("Welcome to Premium! 🎉", {
        description: "Your subscription is now active"
      });

      navigate("/dashboard");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Payment error:", error);
        toast.error("Payment failed", {
          description: "Please try again or contact support"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto">
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Premium Plan</CardTitle>
                  <Badge variant="default" className="gap-1">
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

          {/* Payment Form */}
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Securely process your payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, "");
                      const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                      setCardNumber(formatted);
                    }}
                    maxLength={19}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardExpiry">Expiry Date</Label>
                    <Input
                      id="cardExpiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        const formatted = value.length >= 2 
                          ? `${value.slice(0, 2)}/${value.slice(2, 4)}`
                          : value;
                        setCardExpiry(formatted);
                      }}
                      maxLength={5}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardCvc">CVC</Label>
                    <Input
                      id="cardCvc"
                      placeholder="123"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
                  <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>$10.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>$0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-primary">$10.00</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Complete Purchase"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PremiumCheckout;
