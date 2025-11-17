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
import MessageDialog from "@/components/messaging/MessageDialog";
import PlatformFeeDialog from "@/components/escrow/PlatformFeeDialog";

interface Bid {
  id: string;
  bid_amount: number;
  proposal_text: string;
  status: string;
  created_at: string;
  freelancer_id: string;
  profiles: {
    id?: string;
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);

  useEffect(() => {
    if (open) {
      loadBids();
    }
  }, [open, jobId]);

  const loadBids = async () => {
    setLoading(true);
    
    // Fetch bids
    const { data: bidsData, error: bidsError } = await supabase
      .from("bids")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (bidsError) {
      console.error("Error loading bids:", bidsError);
      toast.error("Failed to load bids");
      setLoading(false);
      return;
    }

    // Fetch profiles for all freelancers
    if (bidsData && bidsData.length > 0) {
      const freelancerIds = bidsData.map(bid => bid.freelancer_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", freelancerIds);

      // Merge profile data with bids
      const bidsWithProfiles = bidsData.map(bid => ({
        ...bid,
        profiles: profilesData?.find(p => p.id === bid.freelancer_id) || { id: bid.freelancer_id, name: "Unknown" }
      }));
      
      setBids(bidsWithProfiles as any);
    } else {
      setBids([]);
    }
    
    setLoading(false);
  };

  const handleAcceptBid = (bid: Bid) => {
    setSelectedBid(bid);
    setPaymentDialogOpen(true);
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
                    <MessageDialog
                      jobId={jobId}
                      freelancerId={bid.profiles.id || ""}
                      freelancerName={bid.profiles.name}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAcceptBid(bid)}
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
                {bid.status === "accepted" && (
                  <MessageDialog
                    jobId={jobId}
                    freelancerId={bid.profiles.id || ""}
                    freelancerName={bid.profiles.name}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {selectedBid && (
          <PlatformFeeDialog
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
            bidId={selectedBid.id}
            bidAmount={selectedBid.bid_amount}
            jobId={jobId}
            freelancerId={selectedBid.profiles.id || ""}
            onSuccess={loadBids}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default JobBidsDialog;
