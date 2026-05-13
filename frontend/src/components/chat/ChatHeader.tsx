import Avatar from "@/components/ui/Avatar";

interface ChatHeaderProps {
    name: string;
    number: string;
    isOnline: boolean;
}

export default function ChatHeader({ name, number, isOnline }: ChatHeaderProps) {
    return <div className="flex items-center gap-3 px-6 py-4 border-b">
        <div className="relative shrink-0">
            <Avatar name={name} />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
        </div>
        <div className="flex flex-col">
            <span className="font-semibold text-base">{name}</span>
            <span className="text-sm">{number}</span>
            <span className="text-xs flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                {isOnline ? "Online" : "Offline"}
            </span>
        </div>
    </div>
}
