import { useEffect, useRef, useCallback } from "react";
import type { Message } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export function useWebSocket(onMessage:(msg:Message)=>void){
    const socketRef = useRef<WebSocket | null>(null);
    const onMessageRef = useRef(onMessage);
    const {user} = useAuth();

    onMessageRef.current = onMessage;

    useEffect(()=>{
        const socket = new WebSocket("ws://localhost:3000");
        socketRef.current = socket;

        socket.onmessage = ((e)=>{
            const msg = JSON.parse(e.data);
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

    return {sendMessage};
}
