import UserItem from "./UserItem";

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
        <div className="space-y-2 h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-1">Oczekujące zaproszenia ({incomingRequests.length})</h2>
            <div className="overflow-y-auto h-full pr-1">
                <ul className="space-y-2">
                    {incomingRequests.map((req) => {
                        const sender = users.find((u) => u.id === req.user_id);
                        return sender ? (
                            <UserItem
                                key={sender.id}
                                user={sender}
                                isFriend={false}
                                isPending={false}
                                onSend={() => onAccept(sender.id)}
                                onRemove={() => {}}
                                actionLabel="✅ Akceptuj"
                            />
                        ) : null;
                    })}
                </ul>
            </div>
        </div>
    );
};

export default PendingRequests;
