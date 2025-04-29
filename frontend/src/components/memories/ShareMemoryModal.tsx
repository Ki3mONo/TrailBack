import { useShareMemoryModal } from "../../hooks/memory/useShareMemoryModal.ts";
import ConfirmationModal from "../common/ConfirmationModal";

export default function ShareMemoryModal({
                                             memoryId,
                                             onClose,
                                         }: {
    memoryId: string;
    onClose: () => void;
}) {
    const {
        friends,
        loading,
        alreadySharedWith,
        isOwner,
        shareWith,
        confirmUnshare,
        confirmUnshareId,
        unshareWith,
        setConfirmUnshareId,
    } = useShareMemoryModal(memoryId);

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
