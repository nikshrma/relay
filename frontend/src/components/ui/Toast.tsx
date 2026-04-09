import { useState, useEffect } from "react";

interface ToastProps{
    message:string;
    duration?:number;
    onClose:()=>void;
}

export default function Toast({message, duration = 3000, onClose}:ToastProps){
    const [visible, setVisible] = useState(true);

    useEffect(()=>{
        const timer = setTimeout(()=>{
            setVisible(false);
            onClose();
        }, duration);
        return ()=>clearTimeout(timer);
    },[duration, onClose]);

    if(!visible) return null;
    return <div className="fixed bottom-6 right-6 border rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg text-sm">
        <span>{message}</span>
        <button className="font-bold cursor-pointer" onClick={()=>{setVisible(false); onClose();}}>✕</button>
    </div>
}
