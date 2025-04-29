import { supabase } from "../supabaseClient";
import { MemoryPayload, Photo, FriendProfile, ShareRecord  } from "../types/types";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const MemoryService = {
    editMemory: async (memoryId: string, userId: string, title: string, description?: string): Promise<void> => {
        const res = await fetch(`${backendUrl}/memories/${memoryId}/edit?user_id=${userId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description }),
        });

        if (!res.ok) {
            throw new Error("Failed to update memory");
        }
    },

    createMemory: async (payload: MemoryPayload) => {
        const res = await fetch(`${backendUrl}/memories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData?.detail || "Failed to create memory");
        }

        return res.json();
    },

    uploadPhoto: async (memoryId: string, file: File, userId: string) => {
        const filePath = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from("photos").upload(filePath, file);

        if (uploadError) {
            throw new Error("Błąd uploadu zdjęcia: " + uploadError.message);
        }

        const { data: urlData } = supabase.storage.from("photos").getPublicUrl(filePath);
        const publicUrl = urlData?.publicUrl;

        if (!publicUrl) {
            throw new Error("Nie udało się uzyskać URL zdjęcia");
        }

        const res = await fetch(`${backendUrl}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                memory_id: memoryId,
                url: publicUrl,
                uploaded_by: userId,
            }),
        });

        if (!res.ok) {
            throw new Error("Failed to save photo");
        }
    },

    fetchPhotos: async (memoryId: string): Promise<Photo[]> => {
        const res = await fetch(`${backendUrl}/photos?memory_id=${memoryId}`);
        if (!res.ok) {
            throw new Error("Failed to fetch photos");
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    },

    deletePhoto: async (photoId: string, userId: string): Promise<void> => {
        const res = await fetch(`${backendUrl}/photos/${photoId}?user_id=${userId}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            if (res.status === 403) {
                throw new Error("Możesz usuwać tylko swoje zdjęcia.");
            }
            throw new Error("Błąd usuwania zdjęcia.");
        }
    },

    deleteMemory: async (memoryId: string, userId: string): Promise<void> => {
        const res = await fetch(`${backendUrl}/memories/${memoryId}?user_id=${userId}`, {
            method: "DELETE",
        });

        if (!res.ok) {
            const errorData = await res.json();
            if (res.status === 403 && errorData?.detail) {
                throw new Error(errorData.detail);
            }
            throw new Error("Błąd usuwania wspomnienia");
        }
    },

    getOwnerProfile: async (userId: string): Promise<FriendProfile> => {
        const res = await fetch(`${backendUrl}/profile?user_id=${userId}`);
        if (!res.ok) throw new Error("Nie udało się pobrać właściciela");
        return await res.json();
    },

    getMemoryShares: async (memoryId: string): Promise<ShareRecord[]> => {
        const res = await fetch(`${backendUrl}/memories/${memoryId}/shares`);
        if (!res.ok) throw new Error("Nie udało się pobrać udostępnień");
        return await res.json();
    },

    getUsersList: async (currentUserId: string): Promise<FriendProfile[]> => {
        const res = await fetch(`${backendUrl}/users?current_user=${currentUserId}`);
        if (!res.ok) throw new Error("Nie udało się pobrać użytkowników");
        return await res.json();
    },

    uploadMemoryPhoto: async (memoryId: string, userId: string, file: File): Promise<void> => {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`${backendUrl}/memories/${memoryId}/upload-photo?user_id=${userId}`, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error(`Błąd uploadu zdjęcia: ${file.name}`);
        }
    },
};
