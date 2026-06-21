import ChatWindow from "@/components/chat/ChatWindow";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageInput from "@/components/chat/MessageInput";
import Sidebar from "@/components/sidebar/Sidebar";
import AppLayout from "@/layouts/AppLayout";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import GroupDetailsModal from "@/components/chat/GroupDetailsModal";
import { useAuth } from "@/contexts/auth";
import { useMessages } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";
import { type Conversation } from "@/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MESSAGE_PREVIEW_LENGTH = 72;

function getMessagePreview(content: string) {
  return content.length > MESSAGE_PREVIEW_LENGTH
    ? `${content.slice(0, MESSAGE_PREVIEW_LENGTH).trim()}...`
    : content;
}

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const { user } = useAuth();
  const { messages, isLoading, addMessage, markRead, markDelivered } =
    useMessages(selectedConversation?.id || "", selectedConversation?.type || 'user');

  const {
    sendMessage,
    onlineUsers,
    sendTyping,
    sendStopTyping,
    typingUsers,
    sendReadMessages,
  } = useWebSocket(
    (msg) => {
      const isCurrentChat = selectedConversation?.type === 'group' 
        ? msg.groupId === selectedConversation.id 
        : !msg.groupId && selectedConversation && msg.senderId === selectedConversation.id;
        
      if (isCurrentChat) {
        addMessage(msg);
        return;
      }

      toast(
        <div 
          className="flex flex-col gap-1 min-w-0 cursor-pointer w-full"
          onClick={() => {
            if (msg.groupId) {
              setSelectedConversation({
                type: 'group',
                id: msg.groupId,
                name: (msg as any).groupName || "Group",
                createdAt: new Date().toISOString()
              });
            } else {
              setSelectedConversation({
                type: 'user',
                id: msg.senderId,
                name: msg.sender.name,
                number: ""
              });
            }
          }}
        >
          <span className="text-sm font-semibold truncate">
            {msg.groupId ? `${(msg as any).groupName || "Group"}` : msg.sender.name}
          </span>
          <span className="text-sm text-neutral-600 line-clamp-2 break-words">
            {msg.groupId ? `${msg.sender.name}: ${getMessagePreview(msg.content)}` : getMessagePreview(msg.content)}
          </span>
        </div>,
        {
          id: msg.id,
          duration: 4000,
          className: "border rounded-lg shadow-lg hover:bg-gray-50 transition-colors",
        },
      );
    },
    markDelivered,
    markRead,
  );

  const handleSend = (content: string) => {
    if (!user || !selectedConversation) return;
    const id = crypto.randomUUID();
    const isGroup = selectedConversation.type === 'group';
    
    sendMessage(
      isGroup ? undefined : selectedConversation.id, 
      content, 
      id, 
      isGroup ? selectedConversation.id : undefined
    );
    
    addMessage({
      id,
      content,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      receiverId: isGroup ? undefined : selectedConversation.id,
      groupId: isGroup ? selectedConversation.id : undefined,
      sender: { id: user.id, name: user.name },
    });
  };
  useEffect(() => {
    const unReadMessageIds = messages
      .filter((m) => {
        const fromOther = selectedConversation?.type === 'group' ? m.senderId !== user?.id : m.senderId === selectedConversation?.id;
        return fromOther && !m.readAt;
      })
      .map((m) => m.id);
    if (!selectedConversation || unReadMessageIds.length === 0) return;
    // We only send read receipts for DMs currently based on backend schema, but let's safely call it
    if (selectedConversation.type === 'user') {
      sendReadMessages(selectedConversation.id, unReadMessageIds);
    }
    markRead(unReadMessageIds);
  }, [messages, selectedConversation]);

  return (
    <AppLayout
      sidebar={
        <Sidebar
          onSelectConversation={setSelectedConversation}
          selectedConversationId={selectedConversation?.id || ""}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
        />
      }
    >
      {selectedConversation ? (
        <div className="flex flex-col h-full">
          <ChatHeader
            name={selectedConversation.name}
            number={selectedConversation.type === 'user' ? selectedConversation.number : ""}
            isOnline={selectedConversation.type === 'user' && onlineUsers.has(selectedConversation.id)}
            isTyping={typingUsers.has(selectedConversation.id)}
            isGroup={selectedConversation.type === 'group'}
            onGroupClick={() => setIsGroupModalOpen(true)}
          />
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <ChatWindow
              messages={messages}
              isTyping={typingUsers.has(selectedConversation.id)}
              name={selectedConversation.name}
              isGroup={selectedConversation.type === 'group'}
            />
          )}
          <MessageInput
            onSend={handleSend}
            onTyping={() => {
              const isGroup = selectedConversation.type === 'group';
              sendTyping(isGroup ? undefined : selectedConversation.id, isGroup ? selectedConversation.id : undefined);
            }}
            stopTyping={() => {
              const isGroup = selectedConversation.type === 'group';
              sendStopTyping(isGroup ? undefined : selectedConversation.id, isGroup ? selectedConversation.id : undefined);
            }}
          />
          {selectedConversation.type === 'group' && (
            <GroupDetailsModal
              groupId={selectedConversation.id}
              isOpen={isGroupModalOpen}
              onClose={() => setIsGroupModalOpen(false)}
              onLeaveSuccess={() => {
                setSelectedConversation(null);
                // Optionally we could trigger a refresh of the group list here
              }}
            />
          )}
        </div>
      ) : (
        <EmptyState message="Select a conversation to start chatting" />
      )}
    </AppLayout>
  );
}
