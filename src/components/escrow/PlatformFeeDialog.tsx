import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface PlatformFeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidId: string;
  bidAmount: number;
  jobId: string;
  freelancerId: string;
  onSuccess: () => void;
}

const PLATFORM_FEE_PERCENTAGE = 0.05; // 5% platform fee

const PlatformFeeDialog = ({
  open,
  onOpenChange,
  bidId,
  bidAmount,
  jobId,
  freelancerId,
  onSuccess,
}: PlatformFeeDialogProps) => {
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  
  const platformFee = bidAmount * PLATFORM_FEE_PERCENTAGE;
  const totalAmount = bidAmount + platformFee;

  const handlePayment = async () => {
    if (!cardNumber.trim()) {
      toast.error("Please enter card details");
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call accept-bid edge function with payment confirmation
      const { data, error } = await supabase.functions.invoke("accept-bid", {
        body: { bid_id: bidId },
      });

      if (error) throw error;

      // Mark platform fee as paid in escrow
      if (data.escrow_id) {
        await supabase
          .from("escrow_transactions")
          .update({ platform_fee_paid: true })
          .eq("id", data.escrow_id);
      }

      toast.success("Payment successful! Bid accepted.");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Platform Fee</DialogTitle>
          <DialogDescription>
            Complete payment to accept this bid and start the job
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bid Amount:</span>
              <span className="font-medium">${bidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee (5%):</span>
              <span className="font-medium">${platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between font-semibold">
              <span>Total to Pay:</span>
              <span className="text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number (Simulated)</Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              maxLength={19}
            />
            <p className="text-xs text-muted-foreground">
              This is a simulated payment. Enter any card number.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handlePayment}
              disabled={processing}
              className="flex-1"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {processing ? "Processing..." : "Pay & Accept Bid"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={processing}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlatformFeeDialog;
