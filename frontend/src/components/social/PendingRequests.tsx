import { AppUser, FriendRequest } from "../../types/types.ts";
import UserItem from "./UserItem.tsx";

interface PendingRequestsProps {
    incomingRequests: FriendRequest[];
    users: AppUser[];
    onAccept: (fromUserId: string) => void;
}

export default function PendingRequests({
                                            incomingRequests,
                                            users,
                                            onAccept,
                                        }: PendingRequestsProps) {
    if (incomingRequests.length === 0) return null;

    return (
        <div className="space-y-2 h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-1">
                Oczekujące zaproszenia ({incomingRequests.length})
            </h2>
            <div className="overflow-y-auto h-full pr-1">
                <ul className="space-y-2">
                    {incomingRequests.map((req) => {
                        const sender = users.find((u) => u.id === req.user_id);
                        if (!sender) return null; // zabezpieczenie
                        return (
                            <UserItem
                                key={sender.id}
                                user={sender}
                                isFriend={false}
                                isPending={false}
                                onSend={() => onAccept(sender.id)}
                                onRemove={() => {}}
                                actionLabel="✅ Akceptuj"
                            />
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
