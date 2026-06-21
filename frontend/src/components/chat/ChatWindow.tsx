import { useAuth } from "@/contexts/auth";
import type { Message } from "@/types";
import MessageBubble from "./MessageBubble";
import { useEffect, useRef } from "react";
import Avatar from "../ui/Avatar";

interface ChatWindowProps {
    messages: Message[];
    isTyping: boolean;
    name: string;
    isGroup?: boolean;
}

export default function ChatWindow({messages , isTyping, name, isGroup}:ChatWindowProps){
    const {user} = useAuth();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(()=>{
        bottomRef.current?.scrollIntoView({behavior:"smooth"});
    },[messages]);

    return <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {messages.map((message)=>(
            <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
                isGroup={isGroup}
            />
        ))}
        {isTyping && (
            <div className="flex items-end gap-2 flex-row">
                <Avatar name={name} size="sm" />
                <div className="max-w-[70%] rounded-2xl px-4 py-3 border rounded-bl-sm bg-gray-50 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" />
                </div>
            </div>
        )}

        <div ref={bottomRef}/>
    </div>
}
