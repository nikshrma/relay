import { useState, useEffect } from "react";
import api from "@/services/api";
import type { Message } from "@/types";

export function useMessages(userId:string){
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(()=>{
        if(!userId) return;
        const load = async()=>{
            setIsLoading(true);
            try{
                const data = await api.getMessages(userId);
                setMessages(data);
            }catch(e){
                console.error("Failed to load messages", e);
            }finally{
                setIsLoading(false);
            }
        };
        load();
    },[userId]);

    const addMessage = (msg:Message)=>{
        setMessages((prev)=>[...prev, msg]);
    };

    return {messages, isLoading, addMessage};
}
