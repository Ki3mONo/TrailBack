import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import PendingRequests from "./PendingRequests";
import SentRequests from "./SentRequests";
import AllUsers from "./AllUsers";

// Typ aplikacyjnego użytkownika
export type AppUser = {
    id: string;
    full_name?: string;
    username?: string;
    email: string;
    avatar_url?: string;
};

type Friendship = {
    user_id: string;
    friend_id: string;
    status: "pending" | "accepted";
};

interface CommunityProps {
    userId: string;
    onFriendsLoaded: React.Dispatch<React.SetStateAction<AppUser[]>>;
}

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Community = ({ userId, onFriendsLoaded }: CommunityProps) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0); // 👈 trigger do ponownego załadowania

    const loadRelations = async () => {
        setLoading(true);
        try {
            const friendsRes = await axios.get<Friendship[]>(`${API_BASE}/friends`, {
                params: { user_id: userId },
            });

            const usersRes = await axios.get<AppUser[]>(`${API_BASE}/users`, {
                params: { current_user: userId },
            });

            const allRelations = friendsRes.data;
            const accepted = allRelations.filter(f => f.status === "accepted");

            const friendIds = accepted.map(f =>
                f.user_id === userId ? f.friend_id : f.user_id
            );

            const myFriends = usersRes.data.filter(u => friendIds.includes(u.id));

            setFriends(accepted);
            setIncomingRequests(allRelations.filter(f => f.status === "pending" && f.friend_id === userId));
            setOutgoingRequests(allRelations.filter(f => f.status === "pending" && f.user_id === userId));
            setUsers(usersRes.data);
            onFriendsLoaded(myFriends); // 👈 przekazujemy znajomych do listy w profilu
        } catch (err) {
            console.error("❌ Błąd podczas ładowania:", err);
            toast.error("Nie udało się załadować społeczności");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRelations();
    }, [userId, refreshKey]);

    const triggerRefresh = () => setRefreshKey(k => k + 1);

    const sendRequest = async (friendId: string) => {
        try {
            await axios.post(`${API_BASE}/friends/request`, null, {
                params: { user_id: userId, friend_id: friendId },
            });
            toast.success("Zaproszenie wysłane!");
            triggerRefresh();
        } catch (err) {
            console.error("Błąd przy wysyłaniu zaproszenia:", err);
            toast.error("Błąd przy wysyłaniu zaproszenia");
        }
    };

    const acceptRequest = async (fromUserId: string) => {
        try {
            await axios.post(`${API_BASE}/friends/accept`, null, {
                params: { user_id: userId, friend_id: fromUserId },
            });
            toast.success("Znajomość zaakceptowana");
            triggerRefresh();
        } catch (err) {
            console.error("Błąd przy akceptowaniu zaproszenia:", err);
            toast.error("Nie udało się zaakceptować zaproszenia");
        }
    };

    if (loading) return <p>Ładowanie...</p>;

    return (
        <div className="flex flex-col flex-1 min-h-0 space-y-4 overflow-hidden">
            {/* Oczekujące zaproszenia */}
            {incomingRequests.length > 0 && (
                <div className="h-28 overflow-y-auto pr-1">
                    <PendingRequests
                        incomingRequests={incomingRequests}
                        users={users}
                        onAccept={acceptRequest}
                    />
                </div>
            )}

            {/* Wysłane zaproszenia */}
            {outgoingRequests.length > 0 && (
                <div className="h-28 overflow-y-auto pr-1">
                    <SentRequests
                        outgoingRequests={outgoingRequests}
                        users={users}
                    />
                </div>
            )}

            {/* Wszyscy użytkownicy */}
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
