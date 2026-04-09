import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/types";
import MessageBubble from "./MessageBubble";
import { useEffect, useRef } from "react";

export default function ChatWindow({messages}:{messages:Message[]}){
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
            />
        ))}
        <div ref={bottomRef}/>
    </div>
}
