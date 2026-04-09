import Avatar from "@/components/ui/Avatar";
import type { Message } from "@/types";

interface MessageBubbleProps{
    message:Message;
    isOwn:boolean;
}

export default function MessageBubble({message, isOwn}:MessageBubbleProps){
    return <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        {!isOwn && <Avatar name={message.sender.name} size="sm"/>}
        <div className={`max-w-[70%] rounded-2xl px-4 py-2 border ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}>
            {!isOwn && <span className="text-xs font-semibold block mb-1">{message.sender.name}</span>}
            <p className="text-sm leading-relaxed">{message.content}</p>
            <span className="text-[10px] block mt-1 text-right">{new Date(message.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
        </div>
    </div>
}
