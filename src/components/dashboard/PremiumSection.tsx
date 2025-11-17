import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Check } from "lucide-react";

interface PremiumSectionProps {
  userId: string;
}

const PremiumSection = ({ userId }: PremiumSectionProps) => {
  const [premiumPlan, setPremiumPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPremiumPlan();
  }, [userId]);

  const loadPremiumPlan = async () => {
    const { data, error } = await supabase
      .from("premium_plans")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error loading premium plan:", error);
      return;
    }

    setPremiumPlan(data);
  };

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const activeUntil = new Date();
      activeUntil.setMonth(activeUntil.getMonth() + 1);

      const { error: planError } = await supabase
        .from("premium_plans")
        .update({
          plan_type: "premium",
          price: 10.00,
          active_until: activeUntil.toISOString(),
        })
        .eq("user_id", userId);

      if (planError) throw planError;

      // Record payment
      const { error: paymentError } = await supabase.from("payments").insert([
        {
          user_id: userId,
          amount: 10.00,
          type: "premium_subscription",
          status: "completed",
        },
      ]);

      if (paymentError) throw paymentError;

      toast.success("Upgraded to Premium successfully!");
      loadPremiumPlan();
    } catch (error: any) {
      toast.error(error.message || "Failed to upgrade");
    } finally {
      setLoading(false);
    }
  };

  const isPremium = premiumPlan?.plan_type === "premium";

  return (
    <Card className={isPremium ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Crown className={`h-5 w-5 ${isPremium ? "text-primary" : "text-muted-foreground"}`} />
          <CardTitle>Premium Plan</CardTitle>
        </div>
        {isPremium && (
          <Badge className="w-fit">Active</Badge>
        )}
        <CardDescription>
          {isPremium
            ? `Active until ${new Date(premiumPlan.active_until).toLocaleDateString()}`
            : "Upgrade for unlimited bids and priority placement"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-accent" />
            <span>Unlimited monthly bids</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-accent" />
            <span>Priority job placement</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-accent" />
            <span>Enhanced profile visibility</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-accent" />
            <span>24/7 priority support</span>
          </div>
        </div>

        {!isPremium && (
          <>
            <div className="border-t border-border pt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">$10</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
            <Button onClick={handleUpgrade} disabled={loading} className="w-full">
              {loading ? "Processing..." : "Upgrade to Premium"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PremiumSection;
