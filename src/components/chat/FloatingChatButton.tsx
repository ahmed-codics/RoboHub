import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import ConversationsDialog from "./ConversationsDialog";

const FloatingChatButton = () => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string>("");
  const [hasMessages, setHasMessages] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    console.log('FloatingChatButton userId:', userId);
    loadUnreadCount();
    checkHasMessages();

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
          console.log('New message received');
          loadUnreadCount();
          checkHasMessages();
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
          console.log('Message updated');
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user?.id);
    if (user) setUserId(user.id);
  };

  const checkHasMessages = async () => {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    console.log('Total messages for user:', count);
    setHasMessages((count || 0) > 0);
  };

  const loadUnreadCount = async () => {
    const { count } = await supabase
      .from("messages")
      .select("*", { count: 'exact', head: true })
      .eq("receiver_id", userId)
      .eq("read", false);

    console.log('Unread count:', count);
    setUnreadCount(count || 0);
  };

  // Don't render button if user not logged in
  if (!userId) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          onClick={() => {
            console.log('Chat button clicked, opening dialog');
            setOpen(true);
          }}
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all relative"
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
          console.log('Dialog open state changed:', newOpen);
          setOpen(newOpen);
          if (!newOpen) {
            // Refresh counts when dialog closes
            loadUnreadCount();
            checkHasMessages();
          }
        }}
        userId={userId}
        onConversationOpen={() => {
          console.log('Conversation opened, refreshing counts');
          loadUnreadCount();
        }}
      />
    </>
  );
};

export default FloatingChatButton;
