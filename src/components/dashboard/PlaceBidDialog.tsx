import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { z } from "zod";

const bidSchema = z.object({
  bid_amount: z.number().positive("Bid amount must be positive").max(10000000, "Bid amount must be less than $10,000,000"),
  proposal_text: z.string().trim().min(50, "Proposal must be at least 50 characters").max(2000, "Proposal must be less than 2000 characters")
});

interface PlaceBidDialogProps {
  jobId: string;
  userId: string;
  onBidPlaced: () => void;
}

const PlaceBidDialog = ({ jobId, userId, onBidPlaced }: PlaceBidDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [proposal, setProposal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = bidSchema.parse({
        bid_amount: parseFloat(bidAmount),
        proposal_text: proposal,
      });

      // Check bid limit for free users
      const { data: premiumData } = await supabase
        .from("premium_plans")
        .select("plan_type, extra_bids")
        .eq("user_id", userId)
        .single();

      const isPremium = premiumData?.plan_type === "premium";
      const extraBids = premiumData?.extra_bids || 0;

      if (!isPremium) {
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        const { data: bidsThisMonth } = await supabase
          .from("bids")
          .select("id")
          .eq("freelancer_id", userId)
          .gte("created_at", monthStart.toISOString())
          .lte("created_at", monthEnd.toISOString());

        const bidCount = bidsThisMonth?.length || 0;
        const maxBids = 10 + extraBids;

        if (bidCount >= maxBids) {
          toast.error(
            `You've reached your monthly bid limit (${maxBids} bids). Upgrade to premium for unlimited bids!`
          );
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase.from("bids").insert({
        job_id: jobId,
        freelancer_id: userId,
        bid_amount: validatedData.bid_amount,
        proposal_text: validatedData.proposal_text,
      });

      if (error) throw error;

      toast.success("Bid placed successfully!");
      setOpen(false);
      setBidAmount("");
      setProposal("");
      onBidPlaced();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to place bid");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="mt-2">
          <Send className="h-4 w-4 mr-2" />
          Place Bid
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Your Bid</DialogTitle>
          <DialogDescription>
            Submit your proposal and bid amount for this project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bid-amount">Bid Amount ($)</Label>
            <Input
              id="bid-amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="1000.00"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proposal">Your Proposal</Label>
            <Textarea
              id="proposal"
              placeholder="Explain why you're the best fit for this project..."
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              required
              rows={5}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Bid"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceBidDialog;
