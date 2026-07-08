import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AppShell from "@/components/layout/AppShell";

const PaymentTest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  const jobId = searchParams.get("job_id");
  const amount = searchParams.get("amount");
  const orderId = searchParams.get("order_id");
  const type = searchParams.get("type");

  useEffect(() => {
    // If it's job funding, we need a jobId. If it's subscription, we don't.
    if (!amount || !orderId || (!jobId && type !== 'subscription')) {
      toast.error("Invalid payment parameters");
      navigate("/dashboard");
    }
  }, [jobId, amount, orderId, type, navigate]);

  const handleSimulateSuccess = async () => {
    setProcessing(true);
    try {
      if (type === 'subscription') {
        // Update subscription payment to completed
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: "completed",
          })
          .eq("metadata->>paymob_order_id", orderId);
          
        if (updateError) throw updateError;
        
        toast.success("Premium Subscription activated!");
      } else {
        // Update job payment intent to completed
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
      }

      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error: unknown) {
      console.error("Payment simulation error:", error);
      toast.error((error as Error).message || "Failed to simulate payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleSimulateFailure = async () => {
    setProcessing(true);
    try {
      if (type === 'subscription') {
        const { error: updateError } = await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("metadata->>paymob_order_id", orderId);
        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from("job_payment_intents")
          .update({
            payment_status: "failed",
            paymob_transaction_id: `DUMMY_TX_FAIL_${Date.now()}`,
          })
          .eq("job_id", jobId);
        if (updateError) throw updateError;
      }

      toast.error("Payment simulation failed");
      setTimeout(() => navigate("/dashboard"), 2000);

    } catch (error: unknown) {
      console.error("Payment simulation error:", error);
      toast.error((error as Error).message || "Failed to simulate payment");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
        <Card className="max-w-md w-full border border-slate-200 shadow-sm bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Test Payment Gateway</CardTitle>
            <CardDescription className="text-slate-500">
              This is a simulated payment page for testing. In production, you'll be redirected to Paymob's payment gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-md space-y-2 border border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">Job Amount:</span>
                <span className="font-bold text-slate-900">${amount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 font-medium">Order ID:</span>
                <span className="font-mono text-xs text-slate-700">{orderId}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleSimulateSuccess}
                disabled={processing}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white border-0 shadow-sm font-medium"
                size="lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Simulate Successful Payment
              </Button>

              <Button
                onClick={handleSimulateFailure}
                disabled={processing}
                variant="outline"
                className="w-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                size="lg"
              >
                <XCircle className="h-5 w-5 mr-2 text-rose-500" />
                Simulate Failed Payment
              </Button>
            </div>

            <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-100">
              <p className="font-bold mb-1 text-slate-700">For Testing Only</p>
              <p className="font-medium">Update Paymob credentials in the config file to enable real payments</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};

export default PaymentTest;
