import { FriendProfile, Friendship, ShareRecord } from "../types/types";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const ShareMemoryService = {
    getFriends: async (userId: string): Promise<FriendProfile[]> => {
        const res = await fetch(`${backendUrl}/friends?user_id=${userId}`);
        const friendships: Friendship[] = await res.json();
        const accepted = friendships.filter(f => f.status === "accepted");
        const friendIds = accepted.map(f => (f.user_id === userId ? f.friend_id : f.user_id));

        const usersRes = await fetch(`${backendUrl}/users?current_user=${userId}`);
        const allUsers: FriendProfile[] = await usersRes.json();
        return allUsers.filter(u => friendIds.includes(u.id));
    },

    getShares: async (memoryId: string): Promise<ShareRecord[]> => {
        const res = await fetch(`${backendUrl}/memories/${memoryId}/shares`);
        return await res.json();
    },

    shareMemory: async (memoryId: string, friendId: string, userId: string): Promise<void> => {
        const res = await fetch(
            `${backendUrl}/memories/${memoryId}/share-user?shared_with=${friendId}&shared_by=${userId}`,
            { method: "POST" }
        );

        if (!res.ok) {
            throw new Error("Error sharing memory");
        }
    },

    unshareMemory: async (memoryId: string, friendId: string, userId: string): Promise<void> => {
        const res = await fetch(
            `${backendUrl}/memories/${memoryId}/share-user/${friendId}?user_id=${userId}`,
            { method: "DELETE" }
        );

        if (!res.ok) {
            throw new Error("Error unsharing memory");
        }
    }
};
