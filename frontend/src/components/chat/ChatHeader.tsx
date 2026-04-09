import Avatar from "@/components/ui/Avatar";

interface ChatHeaderProps{
    name:string;
    number:string;
}

export default function ChatHeader({name, number}:ChatHeaderProps){
    return <div className="flex items-center gap-3 px-6 py-4 border-b">
        <Avatar name={name}/>
        <div className="flex flex-col">
            <span className="font-semibold text-base">{name}</span>
            <span className="text-sm">{number}</span>
        </div>
    </div>
}
