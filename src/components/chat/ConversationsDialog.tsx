import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Briefcase } from "lucide-react";
import MessageDialog from "@/components/messaging/MessageDialog";
import { useConversations, Conversation } from "@/hooks/useConversations";

interface ConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onConversationOpen: () => void;
}

const ConversationsDialog = ({ open, onOpenChange, userId, onConversationOpen }: ConversationsDialogProps) => {
  const { conversations, loading, loadConversations } = useConversations(userId);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadConversations();
    }
  }, [open, userId, loadConversations]);

  const handleConversationClick = async (conversation: Conversation) => {
    // Mark all messages as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("job_id", conversation.jobId)
      .eq("receiver_id", userId)
      .eq("read", false);

    setSelectedConversation(conversation);
    setMessageDialogOpen(true);
    onConversationOpen();
  };

  const handleMessageDialogClose = (newOpen: boolean) => {
    setMessageDialogOpen(newOpen);
    if (!newOpen) {
      loadConversations(); // Refresh conversations list
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
            </DialogTitle>
            <DialogDescription>
              View all your conversations
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-2">Start messaging on your jobs to see conversations here</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div key={`${conversation.jobId}-${conversation.otherUserId}`}>
                    <div
                      onClick={() => handleConversationClick(conversation)}
                      className="flex items-start gap-3 p-4 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-teal-100 text-teal-800">
                          {conversation.otherUserName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm truncate text-slate-900">
                            {conversation.otherUserName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2 bg-teal-600 hover:bg-teal-700">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                          <Briefcase className="h-3 w-3" />
                          <span className="truncate">{conversation.jobTitle}</span>
                        </div>
                        
                        <p className="text-sm text-slate-600 truncate">
                          {conversation.lastMessage}
                        </p>
                        
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(conversation.lastMessageTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                    </div>
                    <Separator className="bg-slate-100" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {selectedConversation && (
        <MessageDialog
          jobId={selectedConversation.jobId}
          freelancerId={selectedConversation.otherUserId}
          freelancerName={selectedConversation.otherUserName}
          open={messageDialogOpen}
          onOpenChange={handleMessageDialogClose}
        />
      )}
    </>
  );
};

export default ConversationsDialog;
