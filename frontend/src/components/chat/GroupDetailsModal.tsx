import { useState, useEffect } from "react";
import api from "@/services/api";
import { type Group, type User } from "@/types";
import { useAuth } from "@/contexts/auth";
import Avatar from "@/components/ui/Avatar";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface GroupDetailsModalProps {
    groupId: string;
    isOpen: boolean;
    onClose: () => void;
    onLeaveSuccess: () => void;
}

export default function GroupDetailsModal({ groupId, isOpen, onClose, onLeaveSuccess }: GroupDetailsModalProps) {
    const { user } = useAuth();
    const [group, setGroup] = useState<Group | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [isAddingMembers, setIsAddingMembers] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const fetchDetails = async () => {
            setIsLoading(true);
            try {
                const groupData = await api.getGroupDetails(groupId);
                setGroup(groupData);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load group details");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [groupId, isOpen]);

    useEffect(() => {
        if (isAddingMembers) {
            const fetchUsers = async () => {
                try {
                    const users = await api.getUsers();
                    setAllUsers(users.filter(u => u.id !== user?.id));
                } catch (error) {
                    console.error(error);
                    toast.error("Failed to load users");
                }
            };
            fetchUsers();
        }
    }, [isAddingMembers, user?.id]);

    if (!isOpen) return null;

    const currentMember = group?.members?.find(m => m.userId === user?.id);
    const isAdmin = currentMember?.role === "ADMIN";

    const handleLeave = async () => {
        if (!confirm("Are you sure you want to leave this group?")) return;
        setIsSubmitting(true);
        try {
            await api.leaveGroup(groupId);
            toast.success("Left group successfully");
            onLeaveSuccess();
            onClose();
        } catch (error) {
            toast.error("Failed to leave group");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await api.removeGroupMembers(groupId, [userId]);
            setGroup(prev => prev ? {
                ...prev,
                members: prev.members?.filter(m => m.userId !== userId)
            } : null);
            toast.success("Member removed");
        } catch (error) {
            toast.error("Failed to remove member");
        }
    };

    const handleAddMembersSubmit = async () => {
        if (selectedUsers.length === 0) return;
        setIsSubmitting(true);
        try {
            await api.addGroupMembers(groupId, selectedUsers);
            const updatedGroup = await api.getGroupDetails(groupId);
            setGroup(updatedGroup);
            setIsAddingMembers(false);
            setSelectedUsers([]);
            toast.success("Members added successfully");
        } catch (error) {
            toast.error("Failed to add members");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUsers(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const nonMembers = allUsers.filter(u => !group?.members?.some(m => m.userId === u.id));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    <h2 className="text-xl font-bold">{isAddingMembers ? "Add Members" : "Group Info"}</h2>
                    <button onClick={() => isAddingMembers ? setIsAddingMembers(false) : onClose()} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        {isAddingMembers ? (
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        )}
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="py-8"><LoadingSpinner /></div>
                    ) : isAddingMembers ? (
                        <div className="space-y-4">
                            {nonMembers.length === 0 ? (
                                <div className="text-center text-gray-500 py-4">No users available to add.</div>
                            ) : (
                                nonMembers.map(u => (
                                    <div 
                                        key={u.id} 
                                        onClick={() => toggleUserSelection(u.id)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedUsers.includes(u.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <div className="flex-1 flex items-center gap-3">
                                            <Avatar name={u.name} />
                                            <div>
                                                <div className="font-medium">{u.name}</div>
                                                <div className="text-sm text-gray-500">{u.number}</div>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedUsers.includes(u.id) ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                                            {selectedUsers.includes(u.id) && (
                                                <svg viewBox="0 0 24 24" width="12" height="12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold shadow-lg mb-4">
                                    {group?.name.charAt(0).toUpperCase()}
                                </div>
                                <h3 className="text-2xl font-bold">{group?.name}</h3>
                                <p className="text-gray-500 mt-1">{group?.members?.length || 0} members</p>
                            </div>

                            <div className="border-t pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-700">Members</h4>
                                    {isAdmin && (
                                        <button 
                                            onClick={() => setIsAddingMembers(true)}
                                            className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
                                        >
                                            + Add Member
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {group?.members?.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={member.user?.name || "User"} />
                                                <div className="flex flex-col">
                                                    <span className="font-medium flex items-center gap-2">
                                                        {member.userId === user?.id ? "You" : member.user?.name}
                                                        {member.role === "ADMIN" && (
                                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase">Admin</span>
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{member.user?.number}</span>
                                                </div>
                                            </div>
                                            {isAdmin && member.userId !== user?.id && (
                                                <button 
                                                    onClick={() => handleRemoveMember(member.userId)}
                                                    className="opacity-0 group-hover:opacity-100 text-sm text-red-500 hover:text-red-700 transition-opacity font-medium px-2 py-1 rounded hover:bg-red-50"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50">
                    {isAddingMembers ? (
                        <button 
                            onClick={handleAddMembersSubmit}
                            disabled={selectedUsers.length === 0 || isSubmitting}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? "Adding..." : `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`}
                        </button>
                    ) : (
                        <button 
                            onClick={handleLeave}
                            disabled={isSubmitting}
                            className="w-full py-2.5 flex items-center justify-center gap-2 text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            {isSubmitting ? "Leaving..." : "Leave Group"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
