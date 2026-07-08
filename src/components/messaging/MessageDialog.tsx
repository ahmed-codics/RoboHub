import { useState, useEffect } from "react";
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
import { MessageCircle } from "lucide-react";
import MessageThread from "@/components/messaging/MessageThread";

interface MessageDialogProps {
  jobId: string;
  freelancerId: string; // Note: This is the 'otherUserId' in the context of the thread
  freelancerName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showReleaseButton?: boolean;
}

const MessageDialog = ({ 
  jobId, 
  freelancerId, 
  freelancerName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showReleaseButton = false
}: MessageDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (open) {
      getCurrentUser();
    }
  }, [open]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!controlledOpen && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl h-[600px] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0 pb-2 border-b">
          <DialogTitle>Chat with {freelancerName}</DialogTitle>
          <DialogDescription>
            Discuss job details and requirements
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-0 pt-2">
          {currentUserId ? (
            <MessageThread
              jobId={jobId}
              otherUserId={freelancerId}
              currentUserId={currentUserId}
              showReleaseButton={showReleaseButton}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Loading...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
