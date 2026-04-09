import ChatWindow from "@/components/ChatWindow";
import { SendMessage } from "@/components/SendMessage";
import UserList from "@/components/UserList";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import { type Message } from "@/types";
import { useEffect, useRef, useState } from "react";

export default function Chat() {
    const [userId, setUserId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const socketRef = useRef<WebSocket | null>(null)
    const { user } = useAuth();
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const data = await api.getMessages(userId);
            setMessages(data);
            setIsLoading(false);
        }
        load()
    }, [userId])
    useEffect(() => {
        const socket = new WebSocket("ws://localhost:3000");
        socketRef.current = socket;

        socket.onmessage = ((e) => {
            const msg = JSON.parse(e.data)
            if (msg.type === "receive_message") {
                const { from, content, name } = msg.payload;
                const newMessage: Message = {
                    id: crypto.randomUUID(),
                    content,
                    createdAt: new Date().toISOString(),
                    senderId: from,
                    receiverId: user!.id,
                    sender: {
                        id: from,
                        name
                    }
                }
                setMessages((prev) => [...prev, newMessage])
            }
        })
        return () => {
            socket.close();
        };
    }, [])
    return <>
        <div>
            <UserList onSelectUser={setUserId} />
        </div><div>
            {isLoading ? (<> Loading...</>) : (<ChatWindow messages={messages} />)}
        </div>
        <div>
            <SendMessage onSend={(content: string) => {
                if (!user) return;
                socketRef.current?.send(JSON.stringify({
                    type: "send_message",
                    payload: { to: userId, content }
                }));
                setMessages((prev) => [...prev, {
                    id: crypto.randomUUID(),
                    content,
                    createdAt: new Date().toISOString(),
                    senderId: user!.id,
                    receiverId: userId,
                    sender: { id: user!.id, name: user!.name }
                }]);
            }} />


        </div>
    </>
}