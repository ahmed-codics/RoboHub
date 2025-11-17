import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface EscrowTransaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  released_at?: string;
  freelancer_id: string;
  jobs: {
    title: string;
  };
}

interface EscrowManagerProps {
  jobId: string;
  isClient: boolean;
}

const EscrowManager = ({ jobId, isClient }: EscrowManagerProps) => {
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEscrow();
  }, [jobId]);

  const loadEscrow = async () => {
    const { data, error } = await supabase
      .from("escrow_transactions")
      .select(`
        *,
        jobs(title)
      `)
      .eq("job_id", jobId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading escrow:", error);
      return;
    }

    setEscrow(data as any);
  };

  const handleReleaseFunds = async () => {
    if (!escrow) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("escrow_transactions")
        .update({
          status: "released",
          released_at: new Date().toISOString(),
        })
        .eq("id", escrow.id);

      if (error) throw error;

      // Update job status to completed
      await supabase
        .from("jobs")
        .update({ status: "completed" })
        .eq("id", jobId);

      // Create notification for freelancer
      await supabase.from("notifications").insert([
        {
          user_id: escrow.freelancer_id,
          type: "payment_released",
          title: "Payment Released",
          message: `Payment of $${escrow.amount} has been released for "${escrow.jobs.title}".`,
        },
      ]);

      toast.success("Funds released successfully!");
      loadEscrow();
    } catch (error: any) {
      toast.error(error.message || "Failed to release funds");
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!escrow) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("escrow_transactions")
        .update({ status: "refunded" })
        .eq("id", escrow.id);

      if (error) throw error;

      // Update job status to cancelled
      await supabase
        .from("jobs")
        .update({ status: "cancelled" })
        .eq("id", jobId);

      toast.success("Funds refunded successfully!");
      loadEscrow();
    } catch (error: any) {
      toast.error(error.message || "Failed to refund");
    } finally {
      setLoading(false);
    }
  };

  if (!escrow) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Escrow Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-semibold">${escrow.amount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="font-semibold capitalize">{escrow.status}</span>
        </div>
        
        {isClient && escrow.status === "held" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleReleaseFunds}
              disabled={loading}
              className="flex-1"
            >
              Release Funds
            </Button>
            <Button
              onClick={handleRefund}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Refund
            </Button>
          </div>
        )}

        {escrow.status === "released" && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Funds released on {new Date(escrow.released_at || "").toLocaleDateString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EscrowManager;
