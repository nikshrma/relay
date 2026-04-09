import { useState } from "react"

//TODO: Update type of onSend function
export function SendMessage({onSend}:{onSend:any}){
    const [message,setMessage] = useState("");
    return <div>
        <input type="text" onChange={(e)=>{setMessage(e.target.value)}} value={message} onKeyDown={(e)=>{
            if(e.key==="Enter"){
                onSend(message);
                setMessage("");
            }
        }}/>
    </div>
}