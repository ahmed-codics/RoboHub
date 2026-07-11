import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FileDisputeDialogProps {
  jobId: string;
  againstId?: string;
  triggerLabel?: string;
  onFiled?: () => void;
}

const REASONS = [
  "Work not delivered",
  "Quality issues",
  "Payment issue",
  "Communication problems",
  "Scope disagreement",
  "Other",
];

const FileDisputeDialog = ({ jobId, againstId, triggerLabel, onFiled }: FileDisputeDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const resetFields = () => {
    setReason(REASONS[0]);
    setDescription("");
    setEvidenceUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in to file a dispute.");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("Please describe the issue in at least 20 characters.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("disputes").insert({
      job_id: jobId,
      raised_by: user.id,
      against_id: againstId ?? null,
      reason,
      description: description.trim(),
      evidence_url: evidenceUrl.trim() || null,
      status: "open",
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not file dispute. Please try again.");
      return;
    }

    toast.success("Dispute filed. Our team will review it.");
    setOpen(false);
    resetFields();
    onFiled?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {triggerLabel || "Raise a Dispute"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Raise a Dispute</DialogTitle>
          <DialogDescription>
            Tell us what went wrong. Our team will review the case and follow up with both parties.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dispute-reason">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="dispute-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-description">Description</Label>
            <Textarea
              id="dispute-description"
              required
              minLength={20}
              rows={5}
              placeholder="Describe the issue in detail (minimum 20 characters)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className="text-xs text-slate-500">{description.trim().length}/20 characters minimum</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute-evidence">Evidence link (optional)</Label>
            <Input
              id="dispute-evidence"
              type="url"
              placeholder="https://..."
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={submitting}>
              {submitting ? "Filing..." : "File Dispute"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FileDisputeDialog;
