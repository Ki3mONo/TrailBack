import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { MemoryService } from "../../services/memoryService.ts";
import { Photo } from "../../types/types.ts";

export function useMemoryModal(memoryId: string, currentUserId: string) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);

    const [confirmDeleteMemory, setConfirmDeleteMemory] = useState(false);
    const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);

    const fetchPhotos = async () => {
        try {
            const data = await MemoryService.fetchPhotos(memoryId);
            setPhotos(data);
        } catch {
            toast.error("Błąd ładowania zdjęć");
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [memoryId]);

    const deletePhoto = async (photoId: string) => {
        try {
            await MemoryService.deletePhoto(photoId, currentUserId);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            toast.success("Usunięto zdjęcie");
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err?.message || "Błąd usuwania zdjęcia");
        }
    };

    const deleteMemory = async (onSuccess: () => void) => {
        try {
            await MemoryService.deleteMemory(memoryId, currentUserId);
            toast.success("Usunięto wspomnienie");
            onSuccess();
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err?.message || "Błąd usuwania wspomnienia");
        }
    };

    return {
        photos,
        previewUrl,
        setPreviewUrl,
        shareOpen,
        setShareOpen,
        editOpen,
        setEditOpen,
        photoModalOpen,
        setPhotoModalOpen,
        fetchPhotos,
        deletePhoto,
        deleteMemory,
        confirmDeleteMemory,
        setConfirmDeleteMemory,
        confirmDeletePhotoId,
        setConfirmDeletePhotoId,
    };
}
