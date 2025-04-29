import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient.ts";
import { toast } from "react-toastify";
import ConfirmationModal from "../common/ConfirmationModal.tsx";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

interface Friendship {
    user_id: string;
    friend_id: string;
    status: string;
}

interface FriendProfile {
    id: string;
    username?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
}

interface ShareRecord {
    shared_with: string;
    shared_by: string;
}

export default function ShareMemoryModal({
                                             memoryId,
                                             onClose,
                                         }: {
    memoryId: string;
    onClose: () => void;
}) {
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [shares, setShares] = useState<ShareRecord[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [confirmUnshareId, setConfirmUnshareId] = useState<string | null>(null); // ⬅️ nowy stan

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return toast.error("Nie jesteś zalogowany");
                setCurrentUserId(user.id);

                const res = await fetch(`${backendUrl}/friends?user_id=${user.id}`);
                const friendships: Friendship[] = await res.json();
                const accepted = friendships.filter(f => f.status === "accepted");
                const friendIds = accepted.map(f =>
                    f.user_id === user.id ? f.friend_id : f.user_id
                );

                const usersRes = await fetch(`${backendUrl}/users?current_user=${user.id}`);
                const allUsers: FriendProfile[] = await usersRes.json();
                const onlyFriends = allUsers.filter(u => friendIds.includes(u.id));
                setFriends(onlyFriends);

                const shareRes = await fetch(`${backendUrl}/memories/${memoryId}/shares`);
                const shareData: ShareRecord[] = await shareRes.json();
                setShares(shareData);
            } catch (err) {
                console.error(err);
                toast.error("Błąd ładowania danych");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [memoryId]);

    const alreadySharedWith = (friendId: string) =>
        shares.some(s =>
            (s.shared_with === friendId && s.shared_by === currentUserId) ||
            (s.shared_with === currentUserId && s.shared_by === friendId)
        );

    const isOwner = (friendId: string) =>
        shares.some(s => s.shared_with === friendId && s.shared_by === currentUserId);

    const shareWith = async (friendId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Brak użytkownika");

        const res = await fetch(
            `${backendUrl}/memories/${memoryId}/share-user?shared_with=${friendId}&shared_by=${user.id}`,
            { method: "POST" }
        );

        if (res.ok) {
            setShares(prev => [...prev, { shared_with: friendId, shared_by: user.id }]);
            toast.success("Wspomnienie udostępnione!");
        } else {
            toast.error("Nie udało się udostępnić wspomnienia");
        }
    };

    const confirmUnshare = (friendId: string) => {
        setConfirmUnshareId(friendId);
    };

    const unshareWith = async () => {
        if (!confirmUnshareId) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return toast.error("Brak użytkownika");

        const res = await fetch(
            `${backendUrl}/memories/${memoryId}/share-user/${confirmUnshareId}?user_id=${user.id}`,
            { method: "DELETE" }
        );

        if (res.ok) {
            setShares(prev =>
                prev.filter(s => !(s.shared_with === confirmUnshareId && s.shared_by === user.id))
            );
            toast.success("Udostępnienie cofnięte");
        } else {
            toast.error("Nie udało się cofnąć udostępnienia");
        }

        setConfirmUnshareId(null); // zamknij modal
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">
                    Udostępnij znajomemu
                </h2>

                {loading ? (
                    <p className="text-center text-gray-600 dark:text-gray-300">
                        Ładowanie znajomych...
                    </p>
                ) : friends.length === 0 ? (
                    <p className="text-center text-gray-500">Brak zaakceptowanych znajomych</p>
                ) : (
                    <ul className="space-y-3">
                        {friends.map((friend) => {
                            const shared = alreadySharedWith(friend.id);
                            const ownerShared = isOwner(friend.id);

                            return (
                                <li
                                    key={friend.id}
                                    className="flex justify-between items-center border-b pb-2"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                                            <img
                                                src={friend.avatar_url && friend.avatar_url.trim() !== "" ? friend.avatar_url : "/placeholder-avatar.png"}
                                                alt="Avatar"
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <div className="text-sm text-gray-800 dark:text-gray-100">
                                            <p className="font-medium">{friend.full_name || "Nieznany"}</p>
                                            <p className="text-xs text-gray-500">@{friend.username}</p>
                                            <p className="text-xs text-gray-400">{friend.email}</p>
                                        </div>
                                    </div>

                                    {shared ? (
                                        ownerShared ? (
                                            <button
                                                className="btn text-sm bg-yellow-100 text-yellow-800"
                                                onClick={() => confirmUnshare(friend.id)}
                                            >
                                                Cofnij
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-500">Udostępnione</span>
                                        )
                                    ) : (
                                        <button
                                            className="btn text-sm"
                                            onClick={() => shareWith(friend.id)}
                                        >
                                            Udostępnij
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}

                <button onClick={onClose} className="btn w-full mt-6">
                    Zamknij
                </button>

                {/* ⬇️ Modal potwierdzenia cofnięcia */}
                {confirmUnshareId && (
                    <ConfirmationModal
                        message="Czy na pewno chcesz cofnąć udostępnienie tego wspomnienia?"
                        onConfirm={unshareWith}
                        onCancel={() => setConfirmUnshareId(null)}
                    />
                )}
            </div>
        </div>
    );
}
