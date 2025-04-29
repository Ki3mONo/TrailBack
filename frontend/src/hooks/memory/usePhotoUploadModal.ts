import { useState } from "react";
import { toast } from "react-toastify";
import { MemoryService } from "../../services/memoryService.ts";

export function usePhotoUploadModal(memoryId: string, userId: string, onClose: () => void, onUploaded?: () => void) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleUpload = async () => {
        if (files.length === 0) {
            toast.warn("Nie wybrano zdjęć.");
            return;
        }

        setIsUploading(true);

        for (const file of files) {
            try {
                await MemoryService.uploadMemoryPhoto(memoryId, userId, file);
                toast.success(`Dodano zdjęcie: ${file.name}`);
            } catch (error: unknown) {
                const err = error as { message?: string };
                toast.error(err?.message || `Błąd przy zdjęciu: ${file.name}`);
            }
        }

        setFiles([]);
        setIsUploading(false);
        onClose();
        onUploaded?.();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
        if (dropped.length > 0) {
            setFiles(prev => [...prev, ...dropped]);
        }
    };

    return {
        files,
        setFiles,
        isUploading,
        isDragging,
        setIsDragging,
        handleUpload,
        handleDrop,
    };
}
