import { useState, useEffect } from "react";
import api from "@/services/api";
import type { Message } from "@/types";

export function useMessages(conversationId: string, type: 'user' | 'group') {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!conversationId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        if (type === 'user') {
            const data = await api.getMessages(conversationId);
            setMessages(data);
        } else if (type === 'group') {
            const data = await api.getGroupMessages(conversationId);
            setMessages(data);
        }
      } catch (e) {
        console.error("Failed to load messages", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [conversationId, type]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };
  const markDelivered = (messageIds: string[]) => {
    const messageIdSet = new Set(messageIds);
    const timeSlot = new Date().toISOString();
    setMessages((prev) =>
      prev.map((message) => {
        return messageIdSet.has(message.id)
          ? {
              ...message,
              deliveredAt: message.deliveredAt ?? timeSlot,
            }
          : message;
      }),
    );
  };
  const markRead = (messageIds: string[]) => {
    const timeSlot = new Date().toISOString();
    const messageIdSet = new Set(messageIds);
    setMessages((prev) =>
      prev.map((message) => {
        return messageIdSet.has(message.id)
          ? {
              ...message,
              readAt: message.readAt ?? timeSlot,
            }
          : message;
      }),
    );
  };
  return { messages, isLoading, addMessage, markDelivered, markRead };
}
