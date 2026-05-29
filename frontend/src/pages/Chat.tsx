import ChatWindow from "@/components/chat/ChatWindow";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageInput from "@/components/chat/MessageInput";
import Sidebar from "@/components/sidebar/Sidebar";
import AppLayout from "@/layouts/AppLayout";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { useMessages } from "@/hooks/useMessages";
import { useWebSocket } from "@/hooks/useWebSocket";
import { type User } from "@/types";
import { useState } from "react";

export default function Chat() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user } = useAuth();
  const { messages, isLoading, addMessage } = useMessages(
    selectedUser?.id || "",
  );

  const { sendMessage, onlineUsers, sendTyping, sendStopTyping, typingUsers } =
    useWebSocket((msg) => {
      if (selectedUser && msg.senderId === selectedUser.id) {
        addMessage(msg);
      }
    });

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

