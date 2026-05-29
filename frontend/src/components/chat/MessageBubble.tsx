import Avatar from "@/components/ui/Avatar";
import type { Message } from "@/types";

interface MessageBubbleProps{
    message:Message;
    isOwn:boolean;
}

export default function MessageBubble({message, isOwn}:MessageBubbleProps){
    return <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        {!isOwn && <Avatar name={message.sender.name} size="sm"/>}
        <div className={`min-w-0 max-w-[70%] rounded-2xl px-4 py-2 border ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"}`}>
            {!isOwn && <span className="text-xs font-semibold block mb-1">{message.sender.name}</span>}
            <p className="text-sm leading-relaxed wrap-break-word">{message.content}</p>
            <div className="flex items-center justify-end gap-1 mt-1">
                <span className="text-[10px]">{new Date(message.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                {isOwn && (
                    message.readAt ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                            <polyline points="18 6 11 17 6 12"></polyline>
                            <polyline points="22 6 15 17 13 14"></polyline>
                        </svg>
                    ) : message.deliveredAt ? (
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                            <polyline points="18 6 11 17 6 12"></polyline>
                            <polyline points="22 6 15 17 13 14"></polyline>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )
                )}
            </div>
        </div>
    </div>
}
