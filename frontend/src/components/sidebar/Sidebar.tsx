import { useAuth } from "@/contexts/AuthContext";
import UserList from "./UserList";
import Avatar from "@/components/ui/Avatar";
import type { User } from "@/types";

interface SidebarProps{
    onSelectUser:(user:User)=>void;
    selectedUserId:string;
}

export default function Sidebar({onSelectUser, selectedUserId}:SidebarProps){
    const {user, logout} = useAuth();

    return <div className="flex flex-col h-full border-r">
        <div className="px-5 py-4 border-b">
            <h2 className="text-xl font-bold tracking-tight">Relay</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
            <UserList onSelectUser={onSelectUser} selectedUserId={selectedUserId}/>
        </div>
        <div className="flex items-center gap-3 px-4 py-4 border-t">
            {user && <Avatar name={user.name} size="sm"/>}
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{user?.name}</span>
                <span className="text-xs truncate">{user?.number}</span>
            </div>
            <button className="text-sm border rounded-md px-3 py-1 cursor-pointer" onClick={logout}>Logout</button>
        </div>
    </div>
}
