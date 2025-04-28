// /src/components/social/SentRequests.tsx

import { AppUser, FriendRequest } from "../types/types";
import UserItem from "./UserItem";

interface SentRequestsProps {
    outgoingRequests: FriendRequest[];
    users: AppUser[];
}

export default function SentRequests({ outgoingRequests, users }: SentRequestsProps) {
    if (outgoingRequests.length === 0) return null;

    return (
        <div className="space-y-2 h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-1">
                Wysłane zaproszenia ({outgoingRequests.length})
            </h2>
            <div className="overflow-y-auto h-full pr-1">
                <ul className="space-y-2">
                    {outgoingRequests.map((req) => {
                        const receiver = users.find((u) => u.id === req.friend_id);
                        return receiver ? (
                            <UserItem
                                key={receiver.id}
                                user={receiver}
                                isFriend={false}
                                isPending={true}
                                onSend={() => {}}
                                onRemove={() => {}}
                            />
                        ) : null;
                    })}
                </ul>
            </div>
        </div>
    );
}
