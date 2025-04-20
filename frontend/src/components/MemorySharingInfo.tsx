import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { supabase } from "../supabaseClient";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

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

export default function MemorySharingInfo({ memoryId, ownerId }: { memoryId: string; ownerId: string }) {
    const [owner, setOwner] = useState<FriendProfile | null>(null);
    const [sharedWith, setSharedWith] = useState<FriendProfile[]>([]);

    useEffect(() => {
        const loadSharingData = async () => {
            try {
                // 👤 Pobierz właściciela
                const ownerRes = await fetch(`${backendUrl}/profile?user_id=${ownerId}`);
                const ownerData: FriendProfile = await ownerRes.json();
                setOwner(ownerData);

                // 📤 Pobierz udostępnienia
                const sharesRes = await fetch(`${backendUrl}/memories/${memoryId}/shares`);
                const shares: ShareRecord[] = await sharesRes.json();

                const onlyOwnerShares = shares
                    .filter(s => s.shared_by === ownerId)
                    .map(s => s.shared_with);

                if (onlyOwnerShares.length === 0) {
                    setSharedWith([]);
                    return;
                }

                // 📦 Pobierz profile użytkowników, którym właściciel udostępnił
                const profilesRes = await fetch(`${backendUrl}/users?current_user=${ownerId}`);
                const allProfiles: FriendProfile[] = await profilesRes.json();
                const filtered = allProfiles.filter(u => onlyOwnerShares.includes(u.id));
                setSharedWith(filtered);
            } catch (err) {
                console.error("Błąd pobierania danych do MemorySharingInfo", err);
                toast.error("Nie udało się pobrać informacji o udostępnieniach");
            }
        };

        loadSharingData();
    }, [memoryId, ownerId]);

    return (
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded shadow-sm space-y-4 mt-4">
            {owner && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Właściciel:</h4>
                    <div className="flex items-center gap-3">
                        <img
                            src={owner.avatar_url || "/placeholder-avatar.png"}
                            alt="Avatar właściciela"
                            className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                        />
                        <div className="text-sm text-gray-800 dark:text-white">
                            <p className="font-medium">{owner.full_name || "Nieznany"}</p>
                            <p className="text-xs text-gray-500">@{owner.username}</p>
                        </div>
                    </div>
                </div>
            )}

            {sharedWith.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Udostępniono dla:</h4>
                    <ul className="space-y-2">
                        {sharedWith.map((user) => (
                            <li key={user.id} className="flex items-center gap-3">
                                <img
                                    src={user.avatar_url || "/placeholder-avatar.png"}
                                    alt="Avatar znajomego"
                                    className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                                />
                                <div className="text-sm text-gray-800 dark:text-white">
                                    <p className="font-medium">{user.full_name || "Nieznany"}</p>
                                    <p className="text-xs text-gray-500">@{user.username}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}