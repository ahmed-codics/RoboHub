import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send } from "lucide-react";

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
}

interface MessageThreadProps {
  jobId: string;
  otherUserId: string;
  currentUserId: string;
  showReleaseButton?: boolean;
}

export const MessageThread = ({
  jobId,
  otherUserId,
  currentUserId,
  showReleaseButton = false
}: MessageThreadProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const markMessagesAsRead = useCallback(async () => {
    if (!currentUserId || !jobId) return;

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("job_id", jobId)
      .eq("receiver_id", currentUserId)
      .eq("read", false);
  }, [currentUserId, jobId]);

  const loadMessages = useCallback(async () => {
    if (!currentUserId || !jobId) return;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("job_id", jobId)
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
      return;
    }

    setMessages(data || []);
  }, [currentUserId, jobId]);

  useEffect(() => {
    if (jobId && currentUserId) {
      loadMessages();
      markMessagesAsRead();
    }
  }, [jobId, currentUserId, loadMessages, markMessagesAsRead]);

  useEffect(() => {
    if (!jobId || !currentUserId) return;

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
          const newMsg = payload.new as Message;
          // Only add message if current user is sender or receiver
          if (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) {
            setMessages(prev => [...prev, newMsg]);
            
            // Mark as read if we received it while open
            if (newMsg.receiver_id === currentUserId) {
              markMessagesAsRead();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId, currentUserId, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !otherUserId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          job_id: jobId,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage("");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to send message");
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

  const handleRequestRelease = async () => {
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

      toast.success(data?.message || "Release request sent to client");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to request release");
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 py-4">
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
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {showReleaseButton && (
        <div className="pt-4 px-1 pb-2">
          <Button 
            onClick={handleRequestRelease}
            disabled={requesting}
            variant="secondary"
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900"
          >
            {requesting ? "Requesting..." : "Request Payment Release"}
          </Button>
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-slate-200 mt-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (Press Enter to send)"
          className="min-h-[60px] resize-none focus-visible:ring-teal-500"
        />
        <Button
          onClick={handleSendMessage}
          disabled={sending || !newMessage.trim()}
          size="icon"
          className="h-[60px] w-[60px] bg-teal-600 hover:bg-teal-700 shrink-0"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MessageThread;
