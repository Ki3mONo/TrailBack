import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { supabase } from "../../supabaseClient.ts";
import { MemoryService } from "../../services/memoryService.ts";
import { validateMemoryForm } from "../../utils/validateMemoryForm.ts";

export function useMemoryForm(position: [number, number] | null, setPosition: (pos: [number, number] | null) => void) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => titleRef.current?.focus(), 300);
    }, []);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Brak użytkownika");
            setIsSubmitting(false);
            return;
        }

        const errorMessage = validateMemoryForm({ title, desc, date, files, position });
        if (errorMessage) {
            toast.error(errorMessage);
            setIsSubmitting(false);
            return;
        }

        try {
            const memory = await MemoryService.createMemory({
                title,
                description: desc,
                lat: position![0],
                lng: position![1],
                created_by: user.id,
                created_at: new Date(date).toISOString(),
            });

            for (const file of files) {
                await MemoryService.uploadPhoto(memory.id, file, user.id);
            }

            toast.success("Wspomnienie zostało dodane.");
            setTitle("");
            setDesc("");
            setFiles([]);
            setDate("");
            setSelectedImage(null);
            setPosition(null);
        } catch (err: unknown) {
            const error = err as { message?: string };
            toast.error(error?.message || "Nie udało się zapisać wspomnienia");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
            file.type.startsWith("image/")
        );
        if (droppedFiles.length > 0) {
            setFiles((prev) => [...prev, ...droppedFiles]);
        }
    };

    return {
        title,
        setTitle,
        desc,
        setDesc,
        files,
        setFiles,
        date,
        setDate,
        isSubmitting,
        handleSubmit,
        isDragging,
        setIsDragging,
        handleDrop,
        selectedImage,
        setSelectedImage,
        titleRef,
        position,
    };
}
