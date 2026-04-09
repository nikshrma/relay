import api from "@/services/api";
import { type User } from "@/types";
import { useEffect, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface UserListProps{
    onSelectUser:(user:User)=>void;
    selectedUserId:string;
}

export default function UserList({onSelectUser, selectedUserId}:UserListProps){
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
            return <div key={user.id} onClick={()=>onSelectUser(user)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b ${isSelected ? "border-l-2" : ""}`}>
                <Avatar name={user.name}/>
                <div className="flex flex-col min-w-0">
                    <span className="font-medium text-sm truncate">{user.name}</span>
                    <span className="text-xs truncate">{user.number}</span>
                </div>
            </div>
        })}
    </div>
}
