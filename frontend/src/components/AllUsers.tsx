import { useState } from "react";
import { AppUser, Friendship } from "../types/types";
import UserItem from "./UserItem";
import ConfirmationModal from "./ConfirmationModal";
import { socialService } from "../services/socialService";
import { toast } from "react-toastify";

interface AllUsersProps {
    users: AppUser[];
    friends: Friendship[];
    outgoingRequests: Friendship[];
    userId: string;
    onSend: (friendId: string) => void;
    onRefresh: () => void;
}

export default function AllUsers({
                                     users,
                                     friends,
                                     outgoingRequests,
                                     userId,
                                     onSend,
                                     onRefresh,
                                 }: AllUsersProps) {
    const [filterText, setFilterText] = useState<string>("");
    const [removeTarget, setRemoveTarget] = useState<AppUser | null>(null);
    const [loadingRemove, setLoadingRemove] = useState<boolean>(false);

    const isFriend = (id: string): boolean =>
        friends.some(
            (f) =>
                (f.user_id === userId && f.friend_id === id) ||
                (f.friend_id === userId && f.user_id === id)
        );

    const isPendingSent = (id: string): boolean =>
        outgoingRequests.some((f) => f.friend_id === id);

    const filteredUsers = users.filter((u) => {
        const search = filterText.toLowerCase();
        return (
            u.full_name?.toLowerCase().includes(search) ||
            u.username?.toLowerCase().includes(search) ||
            u.email.toLowerCase().includes(search)
        );
    });

    const removeFriend = async (): Promise<void> => {
        if (!removeTarget) return;
        setLoadingRemove(true);

        try {
            await socialService.removeFriend(userId, removeTarget.id);
            toast.success("Znajomy został usunięty");
            setRemoveTarget(null);
            onRefresh();
        } catch (error) {
            console.error(error);
            toast.error("Nie udało się usunąć znajomego");
        } finally {
            setLoadingRemove(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-3">Wszyscy użytkownicy</h2>

            {/* Wyszukiwarka */}
            <div className="relative mb-4">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-300 text-lg">
          🔍
        </span>
                <input
                    type="text"
                    placeholder="Szukaj użytkownika..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>

            {/* Lista użytkowników */}
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

            {/* Modal potwierdzający usunięcie */}
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