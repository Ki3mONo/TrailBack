interface Friend {
    id: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
}

interface FriendListProps {
    friends: Friend[];
}

export default function FriendList({ friends }: FriendListProps) {
    return (
        <div className="w-full flex flex-col border-t pt-4 h-[300px]">
            <h3 className="text-lg font-semibold text-center">👥 Znajomi</h3>

            <div className="h-[240px] overflow-y-auto mt-2 px-2">
                {friends.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">Brak znajomych</p>
                ) : (
                    <ul className="space-y-2">
                        {friends.map((friend) => (
                            <li key={friend.id} className="flex items-center gap-3">
                                <img
                                    src={
                                        friend.avatar_url?.trim()
                                            ? friend.avatar_url
                                            : "/placeholder-avatar.png"
                                    }
                                    alt={friend.full_name || "avatar"}
                                    className="w-9 h-9 rounded-full object-cover border dark:border-gray-600"
                                />
                                <div>
                                    <p className="text-sm font-medium">
                                        {friend.full_name || "Nieznajomy"}
                                    </p>
                                    <p className="text-xs text-gray-500">@{friend.username}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

