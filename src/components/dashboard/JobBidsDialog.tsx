import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, User } from "lucide-react";

interface Bid {
  id: string;
  bid_amount: number;
  proposal_text: string;
  status: string;
  created_at: string;
  profiles: {
    name: string;
  };
}

interface JobBidsDialogProps {
  jobId: string;
  jobTitle: string;
}

const JobBidsDialog = ({ jobId, jobTitle }: JobBidsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadBids();
    }
  }, [open, jobId]);

  const loadBids = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bids")
      .select(`
        *,
        profiles!bids_freelancer_id_fkey(name)
      `)
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading bids:", error);
    } else {
      setBids(data as any || []);
    }
    setLoading(false);
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      // Update bid status
      const { error: bidError } = await supabase
        .from("bids")
        .update({ status: "accepted" })
        .eq("id", bidId);

      if (bidError) throw bidError;

      // Update job status
      const { error: jobError } = await supabase
        .from("jobs")
        .update({ status: "in_progress" })
        .eq("id", jobId);

      if (jobError) throw jobError;

      // Reject other bids
      const { error: rejectError } = await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("job_id", jobId)
        .neq("id", bidId);

      if (rejectError) throw rejectError;

      toast.success("Bid accepted successfully!");
      loadBids();
    } catch (error: any) {
      toast.error(error.message || "Failed to accept bid");
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      const { error } = await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("id", bidId);

      if (error) throw error;

      toast.success("Bid rejected");
      loadBids();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject bid");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          View Bids
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bids for: {jobTitle}</DialogTitle>
          <DialogDescription>
            Review and manage proposals from freelancers
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading bids...</p>
        ) : bids.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No bids yet. Share your job to attract freelancers!
          </p>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.id} className="border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold text-foreground">{bid.profiles.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(bid.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary text-lg">
                      ${bid.bid_amount.toLocaleString()}
                    </div>
                    <Badge variant={bid.status === "accepted" ? "default" : "secondary"}>
                      {bid.status}
                    </Badge>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-foreground">{bid.proposal_text}</p>
                </div>

                {bid.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptBid(bid.id)}
                      className="flex-1"
                    >
                      Accept Bid
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectBid(bid.id)}
                      className="flex-1"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JobBidsDialog;
