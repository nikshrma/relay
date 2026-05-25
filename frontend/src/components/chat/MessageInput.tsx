import { useRef, useState } from "react";

interface MessageInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
    onTyping: () => void;
    stopTyping: () => void
}

export default function MessageInput({ onSend, disabled, onTyping, stopTyping }: MessageInputProps) {
    const [message, setMessage] = useState("");
    const typingTimout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const isTyping = useRef(false);

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message);
        setMessage("");
        if(typingTimout.current) clearTimeout(typingTimout.current)
        if(isTyping.current){
            stopTyping();
            isTyping.current=false;
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value)
        if(!isTyping.current){
            onTyping();
            isTyping.current=true;
        }
        if (typingTimout.current) {
            clearTimeout(typingTimout.current)
        }
        typingTimout.current = setTimeout(() => {
            stopTyping()
            isTyping.current = false;
            typingTimout.current = null;
        }, 2000);
    }
    return <div className="flex items-center gap-3 px-6 py-4 border-t">
        <input
            className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={handleChange}
            onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
            }}
            disabled={disabled}
        />
        <button className="px-5 py-2 rounded-full border text-sm font-medium cursor-pointer disabled:opacity-50" onClick={handleSend} disabled={disabled || !message.trim()}>Send</button>
    </div>
}
