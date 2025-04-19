import { useState } from "react";

interface User {
    id: string;
    username?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
}

interface Props {
    user: User;
    isFriend: boolean;
    isPending: boolean;
    onSend: () => void;
    onRemove: () => void;
}

export default function UserItem({ user, isFriend, isPending, onSend, onRemove }: Props) {
    const [avatarSrc, setAvatarSrc] = useState(
        user.avatar_url && user.avatar_url.trim() !== "" ? user.avatar_url : "/placeholder-avatar.png"
    );

    return (
        <li className="flex justify-between items-center border-b pb-2">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
                    <img
                        src={avatarSrc}
                        alt="Avatar"
                        className="object-cover w-full h-full"
                        onError={() => setAvatarSrc("/placeholder-avatar.png")}
                    />
                </div>
                <div>
                    <p className="font-medium">{user.full_name || "Nieznany użytkownik"}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                </div>
            </div>

            {isFriend ? (
                <button onClick={onRemove} className="btn text-sm text-red-500">🗑 Usuń znajomego</button>
            ) : isPending ? (
                <span className="text-yellow-500 font-medium">⌛ Zaproszony</span>
            ) : (
                <button onClick={onSend} className="btn text-sm">➕ Dodaj</button>
            )}
        </li>
    );
}
