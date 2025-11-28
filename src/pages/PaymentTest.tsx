import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PaymentTest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const jobId = searchParams.get("job_id");
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (!jobId || !amount || !orderId) {
      toast.error("Invalid payment parameters");
      navigate("/dashboard");
    }
  }, [jobId, amount, orderId, navigate]);

  const handleSimulateSuccess = async () => {
    setProcessing(true);
    try {
      // Update payment intent to completed
      const { error: updateError } = await supabase
        .from("job_payment_intents")
        .update({
          payment_status: "completed",
          paymob_transaction_id: `DUMMY_TX_${Date.now()}`,
          completed_at: new Date().toISOString(),
        })
        .eq("job_id", jobId);

      if (updateError) throw updateError;

      toast.success("Payment confirmed! Your job is now live and accepting bids.");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error: any) {
      console.error("Payment simulation error:", error);
      toast.error(error.message || "Failed to simulate payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateFailure = async () => {
    setProcessing(true);
    try {
      // Update payment intent to failed
      const { error: updateError } = await supabase
        .from("job_payment_intents")
        .update({
          payment_status: "failed",
          paymob_transaction_id: `DUMMY_TX_FAIL_${Date.now()}`,
        })
        .eq("job_id", jobId);

      if (updateError) throw updateError;

      toast.error("Payment simulation failed");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error: any) {
      console.error("Payment simulation error:", error);
      toast.error(error.message || "Failed to simulate payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Test Payment Gateway</CardTitle>
          <CardDescription>
            This is a simulated payment page for testing. In production, you'll be redirected to Paymob's payment gateway.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Job Amount:</span>
              <span className="font-semibold">${amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Order ID:</span>
              <span className="font-mono text-xs">{orderId}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSimulateSuccess}
              disabled={processing}
              className="w-full"
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Simulate Successful Payment
            </Button>

            <Button
              onClick={handleSimulateFailure}
              disabled={processing}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <XCircle className="h-5 w-5 mr-2" />
              Simulate Failed Payment
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-4 border-t">
            <p className="font-semibold mb-1">For Testing Only</p>
            <p>Update Paymob credentials in the config file to enable real payments</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentTest;
