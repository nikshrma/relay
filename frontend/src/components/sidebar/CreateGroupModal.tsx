import { useState, useEffect } from "react";
import api from "@/services/api";
import type { User, Group } from "@/types";
import Avatar from "@/components/ui/Avatar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface CreateGroupModalProps {
    onClose: () => void;
    onGroupCreated: (group: Group) => void;
}

export default function CreateGroupModal({ onClose, onGroupCreated }: CreateGroupModalProps) {
    const [name, setName] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            setIsLoading(true);
            try {
                const data = await api.getUsers();
                setUsers(data);
            } catch (e) {
                console.error("Failed to load users", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadUsers();
    }, []);

    const handleCreate = async () => {
        if (!name.trim() || selectedUserIds.size === 0) return;
        setIsCreating(true);
        try {
            const group = await api.createGroup(name, Array.from(selectedUserIds));
            onGroupCreated(group);
            onClose();
        } catch (e) {
            console.error("Failed to create group", e);
        } finally {
            setIsCreating(false);
        }
    };

    const toggleUser = (userId: string) => {
        const next = new Set(selectedUserIds);
        if (next.has(userId)) {
            next.delete(userId);
        } else {
            next.add(userId);
        }
        setSelectedUserIds(next);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Create Group</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        &times;
                    </button>
                </div>
                <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
                    <input
                        type="text"
                        placeholder="Group Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="font-medium mb-2 text-sm text-gray-700">Select Members</span>
                        <div className="flex-1 overflow-y-auto border rounded-md">
                            {isLoading ? (
                                <div className="p-4"><LoadingSpinner /></div>
                            ) : (
                                users.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => toggleUser(user.id)}
                                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${selectedUserIds.has(user.id) ? 'bg-blue-50' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUserIds.has(user.id)}
                                            readOnly
                                            className="w-4 h-4 text-blue-600 cursor-pointer"
                                        />
                                        <Avatar name={user.name} size="sm" />
                                        <span className="text-sm font-medium">{user.name}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">Cancel</button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !name.trim() || selectedUserIds.size === 0}
                        className="px-4 py-2 bg-black text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? 'Creating...' : 'Create'}
                    </button>
                </div>
            </div>
        </div>
    );
}
