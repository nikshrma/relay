import { useAuth } from "@/contexts/auth";
import UserList from "./UserList";
import GroupList from "./GroupList";
import CreateGroupModal from "./CreateGroupModal";
import Avatar from "@/components/ui/Avatar";
import type { Conversation, Group, User } from "@/types";
import { useState } from "react";

interface SidebarProps{
    onSelectConversation:(conversation:Conversation)=>void;
    selectedConversationId:string;
    onlineUsers:Set<string>;
    typingUsers:Set<string>;
}

export default function Sidebar({onSelectConversation, selectedConversationId, onlineUsers, typingUsers}:SidebarProps){
    const {user, logout} = useAuth();
    const [tab, setTab] = useState<'dms'|'groups'>('dms');
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [refreshGroupList, setRefreshGroupList] = useState(0);

    const handleSelectUser = (user: User) => {
        onSelectConversation({ ...user, type: 'user' });
    };

    const handleSelectGroup = (group: Group) => {
        onSelectConversation({ ...group, type: 'group' });
    };

    const handleGroupCreated = (group: Group) => {
        setRefreshGroupList(prev => prev + 1);
        handleSelectGroup(group);
    };

    return <div className="flex flex-col h-full border-r">
        <div className="px-5 py-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold tracking-tight">Relay</h2>
        </div>
        
        <div className="flex border-b">
            <button 
                className={`flex-1 py-2 text-sm font-medium ${tab === 'dms' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTab('dms')}
            >
                Direct Messages
            </button>
            <button 
                className={`flex-1 py-2 text-sm font-medium ${tab === 'groups' ? 'border-b-2 border-black text-black' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setTab('groups')}
            >
                Groups
            </button>
        </div>

        {tab === 'groups' && (
            <div className="p-3 border-b bg-gray-50 flex justify-center">
                <button 
                    onClick={() => setShowCreateGroup(true)}
                    className="text-sm bg-white border border-gray-300 shadow-sm rounded-md px-4 py-1.5 font-medium hover:bg-gray-50 w-full"
                >
                    + Create New Group
                </button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto">
            {tab === 'dms' ? (
                <UserList onSelectUser={handleSelectUser} selectedUserId={selectedConversationId} onlineUsers={onlineUsers} typingUsers={typingUsers}/>
            ) : (
                <GroupList onSelectGroup={handleSelectGroup} selectedGroupId={selectedConversationId} refreshTrigger={refreshGroupList} />
            )}
        </div>

        <div className="flex items-center gap-3 px-4 py-4 border-t mt-auto">
            {user && <Avatar name={user.name} size="sm"/>}
            <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium truncate">{user?.name}</span>
                <span className="text-xs truncate">{user?.number}</span>
            </div>
            <button className="text-sm border rounded-md px-3 py-1 cursor-pointer hover:bg-gray-50" onClick={logout}>Logout</button>
        </div>

        {showCreateGroup && (
            <CreateGroupModal 
                onClose={() => setShowCreateGroup(false)} 
                onGroupCreated={handleGroupCreated} 
            />
        )}
    </div>
}
