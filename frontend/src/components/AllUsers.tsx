import { useState } from "react";
import { toast } from "react-toastify";
import UserItem from "./UserItem";
import ConfirmationModal from "./ConfirmationModal";

interface User {
    id: string;
    username?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
}

interface Friendship {
    user_id: string;
    friend_id: string;
    status: string;
}

interface AllUsersProps {
    users: User[];
    friends: Friendship[];
    outgoingRequests: Friendship[];
    userId: string;
    onSend: (friendId: string) => void;
    onRefresh: () => Promise<void> | void;
}

export default function AllUsers({
                                     users,
                                     friends,
                                     outgoingRequests,
                                     userId,
                                     onSend,
                                     onRefresh,
                                 }: AllUsersProps) {
    const [filterText, setFilterText] = useState("");
    const [removeTarget, setRemoveTarget] = useState<User | null>(null);
    const [loadingRemove, setLoadingRemove] = useState(false);

    const isFriend = (id: string) =>
        friends.some(
            (f) =>
                (f.user_id === userId && f.friend_id === id) ||
                (f.friend_id === userId && f.user_id === id)
        );

    const isPendingSent = (id: string) =>
        outgoingRequests.some((f) => f.friend_id === id);

    const filteredUsers = users.filter((u) => {
        const search = filterText.toLowerCase();
        return (
            u.full_name?.toLowerCase().includes(search) ||
            u.username?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search)
        );
    });

    const removeFriend = async () => {
        if (!removeTarget) return;
        setLoadingRemove(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/friends/remove?user_id=${userId}&friend_id=${removeTarget.id}`,
                { method: "DELETE" }
            );

            if (!res.ok) throw new Error("Błąd podczas usuwania znajomego");

            toast.success("Znajomy został usunięty");
            setRemoveTarget(null);
            onRefresh();
        } catch (error) {
            toast.error("Nie udało się usunąć znajomego");
            console.error(error);
        } finally {
            setLoadingRemove(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Wszyscy użytkownicy</h2>

            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-300 text-lg">
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="Szukaj użytkownika..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                <ul className="space-y-2">
                    {filteredUsers.map((u) => (
                        <UserItem
                            key={u.id}
                            user={u}
                            isFriend={isFriend(u.id)}
                            isPending={isPendingSent(u.id)}
                            onSend={() => onSend(u.id)}
                            onRemove={() => setRemoveTarget(u)}
                            disabled={isPendingSent(u.id)}
                        />
                    ))}
                </ul>
            </div>

            {removeTarget && (
                <ConfirmationModal
                    message={`Czy na pewno chcesz usunąć ${removeTarget.full_name || removeTarget.username}?`}
                    onCancel={() => setRemoveTarget(null)}
                    onConfirm={removeFriend}
                    loading={loadingRemove}
                />
            )}
        </div>
    );
}
