import { useState } from "react";

interface MessageInputProps{
    onSend:(content:string)=>void;
    disabled?:boolean;
}

export default function MessageInput({onSend, disabled}:MessageInputProps){
    const [message, setMessage] = useState("");

    const handleSend = ()=>{
        if(!message.trim()) return;
        onSend(message);
        setMessage("");
    };

    return <div className="flex items-center gap-3 px-6 py-4 border-t">
        <input
            className="flex-1 border rounded-full px-4 py-2 text-sm outline-none"
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e)=>setMessage(e.target.value)}
            onKeyDown={(e)=>{
                if(e.key === "Enter") handleSend();
            }}
            disabled={disabled}
        />
        <button className="px-5 py-2 rounded-full border text-sm font-medium cursor-pointer disabled:opacity-50" onClick={handleSend} disabled={disabled || !message.trim()}>Send</button>
    </div>
}
