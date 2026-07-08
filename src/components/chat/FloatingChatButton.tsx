import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import ConversationsDialog from "./ConversationsDialog";

const FloatingChatButton = ({ userId }: { userId: string }) => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setOpen(false);
    setUnreadCount(0);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    loadUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          loadUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`
        },
        () => {
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const loadUnreadCount = async () => {
    if (!userId) return;

    const { count } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("receiver_id", userId)
      .eq("read", false);

    setUnreadCount(count || 0);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="h-14 w-14 rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/30 hover:bg-teal-600 hover:shadow-xl transition-all relative"
          aria-label="Open messages"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <ConversationsDialog 
        open={open} 
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            // Refresh counts when dialog closes
            loadUnreadCount();
          }
        }}
        userId={userId}
        onConversationOpen={() => {
          loadUnreadCount();
        }}
      />
    </>
  );
};

export default FloatingChatButton;
