import { useMemorySharingInfo } from "../../hooks/memory/useMemorySharingInfo.ts";

export default function MemorySharingInfo({ memoryId, ownerId }: { memoryId: string; ownerId: string }) {
    const { owner, sharedWith } = useMemorySharingInfo(memoryId, ownerId);

    return (
        <div className="h-[400px] bg-[var(--card)] p-4 rounded-xl shadow flex flex-col space-y-4">
            {owner && (
                <div className="shrink-0">
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

            <div className="flex-1 flex flex-col overflow-hidden">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">Udostępniono dla:</h4>
                <ul className="flex-1 overflow-y-auto pr-1 overscroll-bounce scrollbar-thin space-y-2">
                    {sharedWith.length > 0 ? (
                        sharedWith.map((user) => (
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
                        ))
                    ) : (
                        <li className="text-sm text-gray-500 italic">Brak udostępnień</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
