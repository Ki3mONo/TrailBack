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

export type Memory = {
    id: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    created_by: string;
    created_at?: string;
    isShared: boolean;
};

export type ViewMode = "list" | "add";

export interface EditMemoryRequest {
    title: string;
    description?: string;
}

export interface ImageModalProps {
    url: string;
    onClose: () => void;
    allImages?: string[];
    memoryName: string;
    onDelete?: (url: string) => void;
}

export interface FriendProfile {
    id: string;
    username?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
}
export interface ShareRecord {
    shared_with: string;
    shared_by: string;
}

export interface MemoryPayload {
    title: string;
    description: string;
    lat: number;
    lng: number;
    created_by: string;
    created_at: string;
}

export interface Photo {
    id: string;
    memory_id: string;
    url: string;
    uploaded_by: string;
}

export interface MemoryModalProps {
    memory: Memory;
    isShared: boolean;
    onClose: () => void;
    onDelete: () => void;
    currentUserId: string;
}

