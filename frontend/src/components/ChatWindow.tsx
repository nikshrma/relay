import { useAuth } from "@/contexts/AuthContext";
import type { Message } from "@/types";


export default function ChatWindow({messages}: {messages:Message[]}){
    const {user} = useAuth()
return <div>
    {messages.map((message)=>{
        if(message.senderId!==user?.id){
            return <div key={message.id}> {message.sender.name}{message.content}</div>
        }
        else{
            return <div key={message.id}> You{message.content}</div>
        }
    })}
</div>
}