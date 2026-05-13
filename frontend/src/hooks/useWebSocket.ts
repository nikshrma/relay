import { useEffect, useRef, useCallback, useState } from "react";
import type { Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useWebSocket(onMessage:(msg:Message)=>void){
    const socketRef = useRef<WebSocket | null>(null);
    const onMessageRef = useRef(onMessage);
    const {user} = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    onMessageRef.current = onMessage;

    useEffect(()=>{
        const socket = new WebSocket("ws://localhost:3000");
        socketRef.current = socket;

        socket.onmessage = ((e)=>{
            const msg = JSON.parse(e.data);

            if(msg.type === "online-users"){
                setOnlineUsers(new Set(msg.payload.users as string[]));
                return;
            }

            if(msg.type === "online"){
                setOnlineUsers((prev)=>new Set([...prev, msg.payload.userId as string]));
                return;
            }

            if(msg.type === "offline"){
                setOnlineUsers((prev)=>{
                    const next = new Set(prev);
                    next.delete(msg.payload.userId as string);
                    return next;
                });
                return;
            }

            if(msg.type === "receive_message"){
                const {from, content, name} = msg.payload;
                const newMessage:Message = {
                    id: crypto.randomUUID(),
                    content,
                    createdAt: new Date().toISOString(),
                    senderId: from,
                    receiverId: user!.id,
                    sender:{
                        id: from,
                        name
                    }
                };
                onMessageRef.current(newMessage);
            }
        });
        return ()=>{
            socket.close();
        };
    },[user]);

    const sendMessage = useCallback((to:string, content:string)=>{
        socketRef.current?.send(JSON.stringify({
            type: "send_message",
            payload: {to, content}
        }));
    },[]);

    return {sendMessage, onlineUsers};
}
