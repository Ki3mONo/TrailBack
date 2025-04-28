export interface AppUser {
    id: string;
    full_name?: string;
    username?: string;
    email: string;
    avatar_url?: string;
}

export interface Friendship {
    user_id: string;
    friend_id: string;
    status: "pending" | "accepted";
}

export interface UserProfile {
    full_name?: string;
    username?: string;
    avatar_url?: string;
}

export interface FriendRequest {
    user_id: string;
    friend_id: string;
}