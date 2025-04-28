import { useEffect } from "react";
import { useSocial } from "../hooks/useSocial";
import { socialService } from "../services/socialService";
import PendingRequests from "./PendingRequests";
import SentRequests from "./SentRequests";
import AllUsers from "./AllUsers";
import { AppUser } from "../types/types";
import { toast } from "react-toastify";

interface CommunityProps {
    userId: string;
    onFriendsLoaded: (friends: AppUser[]) => void;
}

const Community = ({ userId, onFriendsLoaded }: CommunityProps) => {
    const {
        users,
        friends,
        incomingRequests,
        outgoingRequests,
        loading,
        triggerRefresh,
    } = useSocial(userId);

    useEffect(() => {
        if (users.length && friends.length) {
            const myFriends = users.filter((u) =>
                friends.some((f) => f.user_id === u.id || f.friend_id === u.id)
            );
            onFriendsLoaded(myFriends);
        }
    }, [users, friends, onFriendsLoaded]);

    const sendRequest = async (friendId: string): Promise<void> => {
        try {
            await socialService.sendFriendRequest(userId, friendId);
            toast.success("Zaproszenie wysłane!");
            triggerRefresh();
        } catch (error) {
            console.error(error);
            toast.error("Błąd przy wysyłaniu zaproszenia");
        }
    };

    const acceptRequest = async (fromUserId: string): Promise<void> => {
        try {
            await socialService.acceptFriendRequest(userId, fromUserId);
            toast.success("Znajomość zaakceptowana!");
            triggerRefresh();
        } catch (error) {
            console.error(error);
            toast.error("Błąd przy akceptowaniu zaproszenia");
        }
    };

    if (loading) {
        return <p className="text-center mt-10">Ładowanie społeczności...</p>;
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 space-y-4 overflow-hidden">
            {incomingRequests.length > 0 && (
                <div className="h-28 overflow-y-auto pr-1">
                    <PendingRequests
                        incomingRequests={incomingRequests}
                        users={users}
                        onAccept={acceptRequest}
                    />
                </div>
            )}

            {outgoingRequests.length > 0 && (
                <div className="h-28 overflow-y-auto pr-1">
                    <SentRequests
                        outgoingRequests={outgoingRequests}
                        users={users}
                    />
                </div>
            )}

            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <AllUsers
                    users={users}
                    friends={friends}
                    outgoingRequests={outgoingRequests}
                    userId={userId}
                    onSend={sendRequest}
                    onRefresh={triggerRefresh}
                />
            </div>
        </div>
    );
};

export default Community;