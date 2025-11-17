import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

interface MessageDialogProps {
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const MessageDialog = ({ 
  jobId, 
  freelancerId, 
  freelancerName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange
}: MessageDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Use controlled or internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (open) {
      loadMessages();
      getCurrentUser();
      markMessagesAsRead();
    }
  }, [open, jobId]);

  useEffect(() => {
    if (!open || !currentUserId) return;

    // Subscribe to realtime messages for this conversation
    const channel = supabase
      .channel(`messages-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add message if current user is sender or receiver
          if (newMessage.sender_id === currentUserId || newMessage.receiver_id === currentUserId) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, jobId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const markMessagesAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("job_id", jobId)
      .eq("receiver_id", user.id)
      .eq("read", false);
  };

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("job_id", jobId)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
      return;
    }

    setMessages(data || []);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          job_id: jobId,
          sender_id: currentUserId,
          receiver_id: freelancerId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {freelancerName}</DialogTitle>
          <DialogDescription>
            Discuss job details and requirements
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_id === currentUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.sender_id === currentUserId
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send)"
            className="min-h-[60px]"
          />
          <Button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
