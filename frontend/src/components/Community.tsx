import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import PendingRequests from "./PendingRequests";
import SentRequests from "./SentRequests";
import AllUsers from "./AllUsers";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

const Community = ({ userId }: { userId: string }) => {
    const [users, setUsers] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRelations = async () => {
        try {
            console.log("👉 Pobieranie znajomych...");
            const friendsRes = await axios.get(`${API_BASE}/friends`, {
                params: { user_id: userId },
            });
            console.log("✅ friends OK:", friendsRes.data);

            console.log("👉 Pobieranie użytkowników...");
            const usersRes = await axios.get(`${API_BASE}/users`, {
                params: { current_user: userId },
            });
            console.log("✅ users OK:", usersRes.data);

            const allRelations = friendsRes.data;

            setFriends(allRelations.filter((f: any) => f.status === "accepted"));
            setIncomingRequests(allRelations.filter((f: any) =>
                f.status === "pending" && f.friend_id === userId
            ));
            setOutgoingRequests(allRelations.filter((f: any) =>
                f.status === "pending" && f.user_id === userId
            ));
            setUsers(usersRes.data);
        } catch (err: any) {
            console.error("❌ Błąd podczas ładowania:", err);
            toast.error("Nie udało się załadować społeczności");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadRelations();
    }, [userId]);

    const sendRequest = async (friendId: string) => {
        try {
            await axios.post(`${API_BASE}/friends/request`, null, {
                params: { user_id: userId, friend_id: friendId },
            });
            toast.success("Zaproszenie wysłane!");
            await loadRelations();
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
            await loadRelations();
        } catch (err) {
            console.error("Błąd przy akceptowaniu zaproszenia:", err);
            toast.error("Nie udało się zaakceptować zaproszenia");
        }
    };

    if (loading) return <p>Ładowanie...</p>;

    return (
        <div className="space-y-6">
            <PendingRequests
                incomingRequests={incomingRequests}
                users={users}
                onAccept={acceptRequest}
            />
            <SentRequests
                outgoingRequests={outgoingRequests}
                users={users}
            />
            <AllUsers
                users={users}
                friends={friends}
                outgoingRequests={outgoingRequests}
                userId={userId}
                onSend={sendRequest}
                onRefresh={loadRelations} // 👈 DODANE
            />
        </div>
    );
};

export default Community;
