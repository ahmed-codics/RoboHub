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

interface Conversation {
  jobId: string;
  jobTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onConversationOpen: () => void;
}

const ConversationsDialog = ({ open, onOpenChange, userId, onConversationOpen }: ConversationsDialogProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  useEffect(() => {
    if (open && userId) {
      loadConversations();
    }
  }, [open, userId]);

  const loadConversations = async () => {
    setLoading(true);
    
    // Get all messages where user is sender or receiver
    const { data: messagesData, error } = await supabase
      .from("messages")
      .select("job_id, sender_id, receiver_id, message, created_at, read")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading conversations:", error);
      setLoading(false);
      return;
    }

    // Group messages by job_id
    const jobMessages = new Map<string, any[]>();
    messagesData?.forEach(msg => {
      if (!jobMessages.has(msg.job_id)) {
        jobMessages.set(msg.job_id, []);
      }
      jobMessages.get(msg.job_id)!.push(msg);
    });

    // Build conversations
    const conversationsMap = new Map<string, Conversation>();
    
    for (const [jobId, messages] of jobMessages) {
      const lastMessage = messages[0];
      const otherUserId = lastMessage.sender_id === userId 
        ? lastMessage.receiver_id 
        : lastMessage.sender_id;

      // Count unread messages from this user
      const unreadCount = messages.filter(
        m => m.receiver_id === userId && !m.read
      ).length;

      // Get job details
      const { data: jobData } = await supabase
        .from("jobs")
        .select("title")
        .eq("id", jobId)
        .single();

      // Get other user's profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", otherUserId)
        .single();

      conversationsMap.set(jobId, {
        jobId,
        jobTitle: jobData?.title || "Unknown Job",
        otherUserId,
        otherUserName: profileData?.name || "Unknown User",
        lastMessage: lastMessage.message,
        lastMessageTime: lastMessage.created_at,
        unreadCount,
      });
    }

    setConversations(Array.from(conversationsMap.values()));
    setLoading(false);
  };

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

  const handleMessageDialogClose = () => {
    setMessageDialogOpen(false);
    loadConversations(); // Refresh conversations list
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
                  <div key={conversation.jobId}>
                    <div
                      onClick={() => handleConversationClick(conversation)}
                      className="flex items-start gap-3 p-4 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    >
                      <Avatar>
                        <AvatarFallback>
                          {conversation.otherUserName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm truncate">
                            {conversation.otherUserName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Briefcase className="h-3 w-3" />
                          <span className="truncate">{conversation.jobTitle}</span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(conversation.lastMessageTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Separator />
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
