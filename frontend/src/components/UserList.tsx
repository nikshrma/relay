import api from "@/services/api";
import { type User } from "@/types";
import { useEffect, useState } from "react";

export default function UserList({ onSelectUser }: { onSelectUser: (id: string) => void }) {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        const load = async () => {
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
        load();
    }, []);

    if (isLoading) {
        return <div>
            Loading...
        </div>
    }
    return <div>
        {users.map((user) => {
            return <div key={user.id} onClick={() => onSelectUser(user.id)}>
                {user.name}
                {user.number}
            </div>
        })}
    </div>
}