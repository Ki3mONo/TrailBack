import { useEffect, useState } from "react";
import { socialService } from "../services/socialService";
import { AppUser, Friendship } from "../types/types";
import { toast } from "react-toastify";

export function useSocial(userId: string) {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [friends, setFriends] = useState<Friendship[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        loadRelations();
    }, [userId, refreshKey]);

    const loadRelations = async () => {
        setLoading(true);
        try {
            const [friendsData, usersData] = await Promise.all([
                socialService.getFriends(userId),
                socialService.getUsers(userId),
            ]);

            const accepted = friendsData.filter((f) => f.status === "accepted");

            setFriends(accepted);
            setIncomingRequests(friendsData.filter(f => f.status === "pending" && f.friend_id === userId));
            setOutgoingRequests(friendsData.filter(f => f.status === "pending" && f.user_id === userId));
            setUsers(usersData);
        } catch (err) {
            console.error("Błąd ładowania relacji:", err);
            toast.error("Błąd ładowania społeczności");
        } finally {
            setLoading(false);
        }
    };

    const triggerRefresh = () => setRefreshKey((k) => k + 1);

    return {
        users,
        friends,
        incomingRequests,
        outgoingRequests,
        loading,
        triggerRefresh,
    };
}
