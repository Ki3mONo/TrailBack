import axios from "axios";
import { AppUser, Friendship } from "../types/types";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

export const socialService = {
    async getFriends(userId: string) {
        const res = await axios.get<Friendship[]>(`${API_BASE}/friends`, {
            params: { user_id: userId },
        });
        return res.data;
    },

    async getUsers(currentUserId: string) {
        const res = await axios.get<AppUser[]>(`${API_BASE}/users`, {
            params: { current_user: currentUserId },
        });
        return res.data;
    },

    async sendFriendRequest(userId: string, friendId: string) {
        await axios.post(`${API_BASE}/friends/request`, null, {
            params: { user_id: userId, friend_id: friendId },
        });
    },

    async acceptFriendRequest(userId: string, friendId: string) {
        await axios.post(`${API_BASE}/friends/accept`, null, {
            params: { user_id: userId, friend_id: friendId },
        });
    },

    async removeFriend(userId: string, friendId: string) {
        await axios.delete(`${API_BASE}/friends/remove`, {
            params: { user_id: userId, friend_id: friendId },
        });
    },

    async getProfile(userId: string) {
        const res = await axios.get(`${API_BASE}/profile`, {
            params: { user_id: userId },
        });
        return res.data;
    },
};
