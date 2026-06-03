import { useEffect, useRef, useCallback, useState } from "react";
import type { Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useWebSocket(
  onMessage: (msg: Message) => void,
  onDelivered: (messageIds: string[]) => void,
  onRead: (messageIds: string[]) => void,
) {
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);
  const socketRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onDeliveredRef = useRef(onDelivered);
  const onReadRef = useRef(onRead);
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  onMessageRef.current = onMessage;
  onDeliveredRef.current = onDelivered;
  onReadRef.current = onRead;

  useEffect(() => {
    shouldReconnectRef.current = true;
    const connect = () => {
      const socket = new WebSocket("ws://localhost:3000");
      socketRef.current = socket;
      socket.onopen = () => {
        reconnectAttemptsRef.current = 0;
      };
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
        if (msg.type === "read_messages") {
          onReadRef.current(msg.payload.messageIds);
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
      socket.onclose = () => {
        if (!shouldReconnectRef.current) return;
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
        console.log(`Reconnecting in ${delay}ms...`);
      };
      socket.onerror = (err) => {
        console.error("WebSocket error", err);
      };
    };
    connect();
    return () => {
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socketRef.current?.close();
    };
  }, [user]);

  const sendMessage = useCallback((to: string, content: string, id: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current?.send(
        JSON.stringify({
          type: "send_message",
          payload: { to, content, id },
        }),
      );
  }, []);

  const sendTyping = useCallback((to: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current?.send(
        JSON.stringify({
          type: "typing",
          payload: { to },
        }),
      );
  }, []);
  const sendStopTyping = useCallback((to: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current?.send(
        JSON.stringify({
          type: "stop_typing",
          payload: { to },
        }),
      );
  }, []);
  const sendReadMessages = useCallback((to: string, messageIds: string[]) => {
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current?.send(
        JSON.stringify({
          type: "read_messages",
          payload: { to, messageIds },
        }),
      );
  }, []);
  return {
    sendMessage,
    onlineUsers,
    sendTyping,
    sendStopTyping,
    typingUsers,
    sendReadMessages,
  };
}
