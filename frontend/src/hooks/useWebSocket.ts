import { useEffect, useRef, useCallback, useState } from "react";
import type { Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useWebSocket(
  onMessage: (msg: Message) => void,
  onDelivered: (messageIds: string[]) => void,
) {
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onDeliveredRef = useRef(onDelivered);
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  onMessageRef.current = onMessage;
  onDeliveredRef.current = onDelivered;

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3000");
    socketRef.current = socket;

    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "online-users") {
        setOnlineUsers(new Set(msg.payload.users as string[]));
        return;
      }

      if (msg.type === "online") {
        setOnlineUsers(
          (prev) => new Set([...prev, msg.payload.userId as string]),
        );
        return;
      }

      if (msg.type === "offline") {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(msg.payload.userId as string);
          return next;
        });
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(msg.payload.userId as string);
          return next;
        });
        return;
      }

      if (msg.type === "receive_message") {
        const { from, content, name, id } = msg.payload;
        const newMessage: Message = {
          id,
          content,
          createdAt: new Date().toISOString(),
          senderId: from,
          receiverId: user!.id,
          sender: {
            id: from,
            name,
          },
        };
        onMessageRef.current(newMessage);
      }
      if (msg.type === "delivered_messages") {
        onDeliveredRef.current(msg.payload.messageIds);
        return;
      }
      if (msg.type === "typing") {
        setTypingUsers(
          (prev) => new Set([...prev, msg.payload.userId as string]),
        );
        return;
      }
      if (msg.type === "stop_typing") {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(msg.payload.userId as string);
          return next;
        });
        return;
      }
    };
    return () => {
      socket.close();
    };
  }, [user]);

  const sendMessage = useCallback((to: string, content: string, id: string) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "send_message",
        payload: { to, content, id },
      }),
    );
  }, []);

  const sendTyping = useCallback((to: string) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "typing",
        payload: { to },
      }),
    );
  }, []);
  const sendStopTyping = useCallback((to: string) => {
    socketRef.current?.send(
      JSON.stringify({
        type: "stop_typing",
        payload: { to },
      }),
    );
  }, []);

  return { sendMessage, onlineUsers, sendTyping, sendStopTyping, typingUsers };
}
