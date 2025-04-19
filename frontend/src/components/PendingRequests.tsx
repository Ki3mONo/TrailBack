type FriendRequest = {
    user_id: string;
};

type User = {
    id: string;
    full_name?: string;
    username?: string;
    email: string;
};

const PendingRequests = ({
                             incomingRequests,
                             users,
                             onAccept,
                         }: {
    incomingRequests: FriendRequest[];
    users: User[];
    onAccept: (fromUserId: string) => void;
}) => {
    if (incomingRequests.length === 0) return null;

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2">Oczekujące zaproszenia</h2>
            <ul className="space-y-2">
                {incomingRequests.map((req) => {
                    const sender = users.find((u) => u.id === req.user_id);
                    return sender ? (
                        <li key={sender.id} className="flex justify-between items-center border-b pb-2">
                            <div>
                                <p className="font-medium">{sender.full_name || "Nieznany użytkownik"}</p>
                                <p className="text-sm text-gray-500">@{sender.username}</p>
                                <p className="text-sm text-gray-400">{sender.email}</p>
                            </div>
                            <button onClick={() => onAccept(sender.id)} className="btn text-sm">
                                ✅ Akceptuj
                            </button>
                        </li>
                    ) : null;
                })}
            </ul>
        </div>
    );
};

export default PendingRequests;
