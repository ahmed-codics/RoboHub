import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DollarSign, CheckCircle } from "lucide-react";

interface EscrowTransaction {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  released_at?: string;
  freelancer_id: string;
  platform_fee_paid: boolean;
  release_requested: boolean;
  release_requested_at: string | null;
  jobs: {
    title: string;
  };
}

interface EscrowManagerProps {
  jobId: string;
  isClient: boolean;
  isFreelancer?: boolean;
}

const EscrowManager = ({ jobId, isClient, isFreelancer = false }: EscrowManagerProps) => {
  const [escrow, setEscrow] = useState<EscrowTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadEscrow();
    checkAdminStatus();
  }, [jobId]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);
  };

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
      const { data, error } = await supabase.functions.invoke(
        'release-escrow-funds',
        {
          body: {
            job_id: jobId,
            action: 'approve_release'
          }
        }
      );

      if (error) throw error;

      toast.success(data.message || "Funds released successfully!");
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

  const handleRequestRelease = async () => {
    if (!escrow) return;

    setRequesting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'release-escrow-funds',
        {
          body: {
            job_id: jobId,
            action: 'request_release'
          }
        }
      );

      if (error) throw error;

      toast.success(data.message || "Release request sent to client");
      loadEscrow();
    } catch (error: any) {
      toast.error(error.message || "Failed to request release");
    } finally {
      setRequesting(false);
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
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Platform Fee</span>
          {escrow.platform_fee_paid ? (
            <Badge variant="default">
              <CheckCircle className="h-3 w-3 mr-1" />
              Paid
            </Badge>
          ) : (
            <Badge variant="secondary">Pending</Badge>
          )}
        </div>

        {escrow.release_requested && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
              Release Requested
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
              {new Date(escrow.release_requested_at!).toLocaleString()}
            </p>
          </div>
        )}

        {isFreelancer && escrow.status === "held" && !escrow.release_requested && (
          <Button 
            onClick={handleRequestRelease} 
            disabled={requesting}
            className="w-full"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {requesting ? "Requesting..." : "Request Release"}
          </Button>
        )}
        
        {(isClient || isAdmin) && escrow.status === "held" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleReleaseFunds}
              disabled={loading}
              className="flex-1"
            >
              {isAdmin ? "Admin Release" : "Release Funds"}
            </Button>
            {isClient && (
              <Button
                onClick={handleRefund}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Refund
              </Button>
            )}
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
