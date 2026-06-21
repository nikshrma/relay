import api from "@/services/api";
import { type Group } from "@/types";
import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface GroupListProps {
    onSelectGroup: (group: Group) => void;
    selectedGroupId: string;
    refreshTrigger: number;
}

export default function GroupList({ onSelectGroup, selectedGroupId, refreshTrigger }: GroupListProps) {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const data = await api.getGroups();
                setGroups(data);
            } catch (e) {
                console.error("Failed to load groups", e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [refreshTrigger]);

    if (isLoading) {
        return <LoadingSpinner />;
    }
    
    if (groups.length === 0) {
        return <div className="p-4 text-sm text-gray-500 text-center">No groups found.</div>;
    }

    return (
        <div className="flex flex-col">
            {groups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                return (
                    <div
                        key={group.id}
                        onClick={() => onSelectGroup(group)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b ${isSelected ? "border-l-2 border-black bg-gray-50" : "hover:bg-gray-50"}`}
                    >
                        <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold text-lg">
                            {group.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm truncate">{group.name}</span>
                            <span className="text-xs text-gray-500 truncate">{group.members?.length || 0} members</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
