import { useState } from "react";
import { toast } from "react-toastify";

interface User {
    id: string;
    username?: string;
    full_name?: string;
    email?: string;
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

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Wszyscy użytkownicy</h2>

            <div className="max-h-96 overflow-y-auto pr-2">
                <ul className="space-y-2">
                    {users.map((u) => (
                        <li key={u.id} className="flex justify-between items-center border-b pb-2">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                                    <img
                                        src={u.avatar_url && u.avatar_url.trim() !== "" ? u.avatar_url : "/placeholder-avatar.png"}
                                        alt="Avatar"
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div>
                                    <p className="font-medium">{u.full_name || "Nieznany użytkownik"}</p>
                                    <p className="text-sm text-gray-500">@{u.username}</p>
                                    <p className="text-sm text-gray-400">{u.email}</p>
                                </div>
                            </div>


                            {isFriend(u.id) ? (
                                <button
                                    onClick={() => setRemoveTarget(u)}
                                    className="btn text-sm text-red-500"
                                >
                                    🗑 Usuń znajomego
                                </button>
                            ) : isPendingSent(u.id) ? (
                                <span className="text-yellow-500 font-medium">⌛ Zaproszony</span>
                            ) : (
                                <button
                                    onClick={() => onSend(u.id)}
                                    className="btn text-sm"
                                >
                                    ➕ Dodaj
                                </button>
                            )}
                        </li>
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
