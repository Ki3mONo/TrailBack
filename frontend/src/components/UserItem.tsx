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
    actionLabel?: string;
    disabled?: boolean;
}

export default function UserItem({
                                     user,
                                     isFriend,
                                     isPending,
                                     onSend,
                                     onRemove,
                                     actionLabel,
                                     disabled = false,
                                 }: Props) {
    const [avatarSrc, setAvatarSrc] = useState(
        user.avatar_url && user.avatar_url.trim() !== "" ? user.avatar_url : "/placeholder-avatar.png"
    );

    return (
        <li className="flex justify-between items-center border-b pb-3 gap-4">
            {/* AVATAR */}
            <div className="w-12 h-12 rounded-full overflow-hidden border dark:border-gray-600 shadow">
                <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarSrc("/placeholder-avatar.png")}
                />
            </div>

            {/* INFORMACJE */}
            <div className="flex-1 space-y-0.5">
                <p className="font-medium">{user.full_name}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
            </div>

            {/* AKCJA */}
            <div className="min-w-[150px] flex justify-end">
                <button
                    onClick={isFriend ? onRemove : onSend}
                    disabled={disabled || isPending}
                    className={`
                        w-full px-3 py-1 text-sm text-center rounded-lg transition
                        ${isFriend ? "bg-gray-100 dark:bg-gray-700 text-red-500 hover:bg-gray-200 dark:hover:bg-gray-600" : ""}
                        ${isPending ? "bg-gray-100 dark:bg-gray-700 text-yellow-500 cursor-default" : ""}
                        ${!isFriend && !isPending && !disabled ? "bg-gray-100 dark:bg-gray-700 text-purple-600 hover:bg-gray-200 dark:hover:bg-gray-600" : ""}
                        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                >
                    {isFriend && "🗑️ Usuń"}
                    {isPending && "⏳ Zaproszony"}
                    {!isFriend && !isPending && !disabled && (actionLabel || "➕ Dodaj")}
                </button>
            </div>
        </li>
    );
}
