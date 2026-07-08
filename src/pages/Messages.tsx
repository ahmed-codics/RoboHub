import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useConversations, Conversation } from "@/hooks/useConversations";
import MessageThread from "@/components/messaging/MessageThread";
import { Cpu, MessageCircle, Briefcase, ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

const Messages = () => {
  const { user } = useAuth();
  const { userRole, refreshRole } = useUserRole();
  const { conversations, loading, loadConversations } = useConversations(user?.id);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  if (!user || !userRole) return null;

  return (
    <DashboardShell userRole={userRole} onRoleChange={refreshRole}>
      <div className="bg-white border border-slate-200 shadow-sm rounded-lg flex h-[calc(100vh-10rem)] overflow-hidden">
        
        {/* Left Pane: Conversation List */}
        <div className={`w-full md:w-1/3 border-r border-slate-200 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Conversations
            </h2>
          </div>
          
          <div className="flex-1 overflow-hidden min-h-0">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading conversations...</p>
            ) : conversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-12 px-4">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start messaging on your jobs to see conversations here</p>
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => (
                    <div key={`${conversation.jobId}-${conversation.otherUserId}`}>
                      <div
                        onClick={() => setSelectedConversation(conversation)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConversation?.jobId === conversation.jobId && selectedConversation?.otherUserId === conversation.otherUserId
                            ? 'bg-slate-100'
                            : 'hover:bg-slate-50'
                        }`}
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
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        {/* Right Pane: Active Thread */}
        <div className={`w-full md:w-2/3 flex flex-col bg-slate-50 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden shrink-0" 
                  onClick={() => setSelectedConversation(null)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedConversation.otherUserName}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {selectedConversation.jobTitle}
                  </p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden min-h-0 p-4">
                <MessageThread 
                  jobId={selectedConversation.jobId}
                  otherUserId={selectedConversation.otherUserId}
                  currentUserId={user.id}
                  showReleaseButton={false} // Adjust as needed
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
               <div className="text-center">
                 <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                 <p className="text-slate-500 font-medium">Select a conversation to start messaging</p>
               </div>
            </div>
          )}
        </div>

      </div>
    </DashboardShell>
  );
};

export default Messages;
