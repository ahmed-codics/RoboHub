import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  jobId: string;
  jobTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const useConversations = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Get all messages where user is sender or receiver with job and profile data
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select(`
          id,
          job_id,
          sender_id,
          receiver_id,
          message,
          created_at,
          read,
          jobs!inner(title)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading conversations:", error);
        setLoading(false);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Group messages by job_id and other user
      const conversationsMap = new Map<string, {
        messages: Record<string, unknown>[];
        otherUserId: string;
      }>();
      
      messagesData.forEach(msg => {
        const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const key = `${msg.job_id}-${otherUserId}`;
        
        if (!conversationsMap.has(key)) {
          conversationsMap.set(key, {
            messages: [],
            otherUserId
          });
        }
        conversationsMap.get(key)!.messages.push(msg);
      });

      // Get all unique user IDs
      const userIds = Array.from(new Set(
        Array.from(conversationsMap.values()).map(c => c.otherUserId)
      ));

      // Fetch all profiles at once
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      const profilesMap = new Map(
        profilesData?.map(p => [p.id, p.name]) || []
      );

      // Build conversations array
      const conversationsArray: Conversation[] = [];
      
      for (const [key, { messages, otherUserId }] of conversationsMap) {
        const lastMessage = messages[0];
        const unreadCount = messages.filter(
          m => m.receiver_id === userId && !m.read
        ).length;

        conversationsArray.push({
          jobId: lastMessage.job_id,
          jobTitle: lastMessage.jobs?.title || "Unknown Job",
          otherUserId,
          otherUserName: profilesMap.get(otherUserId) || "Unknown User",
          lastMessage: lastMessage.message,
          lastMessageTime: lastMessage.created_at,
          unreadCount,
        });
      }
      
      // Sort by last message time
      conversationsArray.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(conversationsArray);
    } catch (error) {
      console.error('Error in loadConversations:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    conversations,
    loading,
    loadConversations
  };
};
