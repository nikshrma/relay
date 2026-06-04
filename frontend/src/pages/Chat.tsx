import ChatWindow from "@/components/chat/ChatWindow";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageInput from "@/components/chat/MessageInput";
import Sidebar from "@/components/sidebar/Sidebar";
import AppLayout from "@/layouts/AppLayout";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/auth";
import { useMessages } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";
import { type User } from "@/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const MESSAGE_PREVIEW_LENGTH = 72;

function getMessagePreview(content: string) {
  return content.length > MESSAGE_PREVIEW_LENGTH
    ? `${content.slice(0, MESSAGE_PREVIEW_LENGTH).trim()}...`
    : content;
}

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user } = useAuth();
  const { messages, isLoading, addMessage, markRead, markDelivered } =
    useMessages(selectedUser?.id || "");

  const {
    sendMessage,
    onlineUsers,
    sendTyping,
    sendStopTyping,
    typingUsers,
    sendReadMessages,
  } = useWebSocket(
    (msg) => {
      if (selectedUser && msg.senderId === selectedUser.id) {
        addMessage(msg);
        return;
      }

      toast(
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{msg.sender.name}</span>
          <span className="text-sm text-neutral-600 line-clamp-2 break-words">
            {getMessagePreview(msg.content)}
          </span>
        </div>,
        {
          duration: 4000,
          className: "border rounded-lg shadow-lg",
        },
      );
    },
    markDelivered,
    markRead,
  );

  const handleSend = (content: string) => {
    if (!user || !selectedUser) return;
    const id = crypto.randomUUID();
    sendMessage(selectedUser.id, content, id);
    addMessage({
      id,
      content,
      createdAt: new Date().toISOString(),
      senderId: user.id,
      receiverId: selectedUser.id,
      sender: { id: user.id, name: user.name },
    });
  };
  useEffect(() => {
    const unReadMessageIds = messages
      .filter((m) => {
        return m.senderId === selectedUser?.id && !m.readAt;
      })
      .map((m) => m.id);
    if (!selectedUser || unReadMessageIds.length == 0) return;
    sendReadMessages(selectedUser.id, unReadMessageIds);
    markRead(unReadMessageIds);
  }, [messages, selectedUser]);

  return (
    <AppLayout
      sidebar={
        <Sidebar
          onSelectUser={setSelectedUser}
          selectedUserId={selectedUser?.id || ""}
          onlineUsers={onlineUsers}
          typingUsers={typingUsers}
        />
      }
    >
      {selectedUser ? (
        <div className="flex flex-col h-full">
          <ChatHeader
            name={selectedUser.name}
            number={selectedUser.number}
            isOnline={onlineUsers.has(selectedUser.id)}
            isTyping={typingUsers.has(selectedUser.id)}
          />
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <ChatWindow
              messages={messages}
              isTyping={typingUsers.has(selectedUser.id)}
              name={selectedUser.name}
            />
          )}
          <MessageInput
            onSend={handleSend}
            onTyping={() => {
              sendTyping(selectedUser.id);
            }}
            stopTyping={() => sendStopTyping(selectedUser.id)}
          />
        </div>
      ) : (
        <EmptyState message="Select a conversation to start chatting" />
      )}
    </AppLayout>
  );
}
