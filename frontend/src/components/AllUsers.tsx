import { useState } from "react";
import { toast } from "react-toastify";
import UserItem from "./UserItem";

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
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const [removeTarget, setRemoveTarget] = useState<User | null>(null);
    const [loadingRemove, setLoadingRemove] = useState(false);
    const [filterText, setFilterText] = useState("");

    const isFriend = (id: string) =>
        friends.some(
            (f) =>
                (f.user_id === userId && f.friend_id === id) ||
                (f.friend_id === userId && f.user_id === id)
        );

    const isPendingSent = (id: string) =>
        outgoingRequests.some((f) => f.friend_id === id);

    const removeFriend = async () => {
        if (!removeTarget) return;
        setLoadingRemove(true);

        try {
            const params = new URLSearchParams({
                user_id: userId,
                friend_id: removeTarget.id,
            });

            const res = await fetch(`${backendUrl}/friends/remove?${params.toString()}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error();

            toast.success("Znajomy został usunięty");
            setRemoveTarget(null);

            if (typeof onRefresh === "function") {
                await onRefresh();
            }
        } catch (err) {
            console.error(err);
            toast.error("Błąd podczas usuwania znajomego");
        } finally {
            setLoadingRemove(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        const search = filterText.toLowerCase();
        return (
            u.full_name?.toLowerCase().includes(search) ||
            u.username?.toLowerCase().includes(search) ||
            u.email?.toLowerCase().includes(search)
        );
    });

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Wszyscy użytkownicy</h2>

            <div className="relative mb-4">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-gray-300 text-lg">
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="Szukaj użytkownika..."
                    className="w-full pl-10 pr-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>


            <div className="max-h-96 overflow-y-auto pr-2">
                <ul className="space-y-2">
                    {filteredUsers.map((u) => (
                        <UserItem
                            key={u.id}
                            user={u}
                            isFriend={isFriend(u.id)}
                            isPending={isPendingSent(u.id)}
                            onSend={() => onSend(u.id)}
                            onRemove={() => setRemoveTarget(u)}
                        />
                    ))}
                </ul>
            </div>

            {removeTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-semibold text-center mb-4">Usuń znajomego</h3>
                        <p className="text-sm text-center mb-6 text-gray-600 dark:text-gray-300">
                            Czy na pewno chcesz usunąć{" "}
                            <strong>{removeTarget.full_name || removeTarget.username}</strong>? <br />
                            Utracisz dostęp do wspólnych wspomnień.
                        </p>

                        <div className="flex justify-between gap-4">
                            <button
                                className="btn-outline w-full"
                                onClick={() => setRemoveTarget(null)}
                            >
                                Anuluj
                            </button>
                            <button
                                className="btn bg-red-600 text-white w-full"
                                onClick={removeFriend}
                                disabled={loadingRemove}
                            >
                                {loadingRemove ? "Usuwanie..." : "Usuń"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
