import api from "@/services/api";
import { type User } from "@/types";
import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface UserListProps{
    onSelectUser:(user:User)=>void;
    selectedUserId:string;
    onlineUsers:Set<string>;
}

export default function UserList({onSelectUser, selectedUserId, onlineUsers}:UserListProps){
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(()=>{
        const load = async()=>{
            setIsLoading(true);
            try{
                const data = await api.getUsers();
                setUsers(data);
            }catch(e){
                console.error("Failed to load users", e);
            }finally{
                setIsLoading(false);
            }
        };
        load();
    },[]);

    if(isLoading){
        return <LoadingSpinner/>
    }
    return <div className="flex flex-col">
        {users.map((user)=>{
            const isSelected = selectedUserId === user.id;
            const isOnline = onlineUsers.has(user.id);
            return <div key={user.id} onClick={()=>onSelectUser(user)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b ${isSelected ? "border-l-2" : ""}`}>
                <div className="relative shrink-0">
                    <Avatar name={user.name}/>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`}/>
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm truncate">{user.name}</span>
                    <span className="text-xs truncate">{user.number}</span>
                </div>
            </div>
        })}
    </div>
}
