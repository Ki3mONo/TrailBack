import { useState } from "react";
import { toast } from "react-toastify";
import { MemoryService } from "../../services/memoryService.ts";

export function useEditMemory(memoryId: string, userId: string, onSave: (title: string, description?: string) => void, onClose: () => void, initialTitle: string, initialDescription = "") {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Tytuł nie może być pusty");
            return;
        }

        setLoading(true);
        try {
            await MemoryService.editMemory(memoryId, userId, title, description);
            onSave(title, description);
            onClose();
        } catch {
            toast.error("Błąd zapisu zmian");
        } finally {
            setLoading(false);
        }
    };

    return {
        title,
        setTitle,
        description,
        setDescription,
        loading,
        handleSubmit,
    };
}
