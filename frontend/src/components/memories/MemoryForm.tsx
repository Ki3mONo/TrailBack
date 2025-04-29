import { useState, useRef, useEffect } from "react";
import { supabase } from "../../supabaseClient.ts";
import { toast } from "react-toastify";

interface MemoryFormProps {
    position: [number, number] | null;
    setPosition: (pos: [number, number] | null) => void;
}

interface Memory {
    id: string;
}

interface ApiError {
    detail?: string;
}

export default function MemoryForm({ position, setPosition }: MemoryFormProps) {
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => titleRef.current?.focus(), 300);
    }, []);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;

        if (!user || !position || files.length === 0 || !date || !title) {
            toast.error("Uzupełnij wszystkie dane, wybierz lokalizację, datę i zdjęcia.");
            setIsSubmitting(false);
            return;
        }

        const parsedDate = new Date(date);
        const now = new Date();
        if (isNaN(parsedDate.getTime()) || parsedDate > now) {
            toast.error("Data jest nieprawidłowa lub z przyszłości.");
            setIsSubmitting(false);
            return;
        }

        const memoryPayload = {
            title,
            description: desc,
            lat: position[0],
            lng: position[1],
            created_by: user.id,
            created_at: parsedDate.toISOString(),
        };

        let memory: Memory;
        try {
            const res = await fetch(`${backendUrl}/memories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(memoryPayload),
            });

            if (!res.ok) {
                const errorData: ApiError = await res.json();
                throw errorData;
            }

            memory = await res.json();
        } catch (err) {
            const error = err as ApiError;
            toast.error("Błąd: " + (error?.detail || "Nie udało się zapisać wspomnienia"));
            setIsSubmitting(false);
            return;
        }

        for (const file of files) {
            const filePath = `${Date.now()}_${file.name}`;
            const { error: uploadErr } = await supabase.storage.from("photos").upload(filePath, file);
            if (uploadErr) {
                toast.error("Błąd uploadu zdjęcia: " + uploadErr.message);
                continue;
            }

            const { data: urlData } = supabase.storage.from("photos").getPublicUrl(filePath);
            const publicUrl = urlData?.publicUrl;
            if (!publicUrl) continue;

            await fetch(`${backendUrl}/photos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memory_id: memory.id,
                    url: publicUrl,
                    uploaded_by: user.id,
                }),
            });
        }

        toast.success("Wspomnienie zostało dodane.");
        setTitle("");
        setDesc("");
        setFiles([]);
        setPosition(null);
        setDate("");
        setSelectedImage(null);
        setIsSubmitting(false);
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

    return (
        <div
            className={`w-full max-w-md bg-[var(--card)] p-4 rounded-xl shadow-lg flex flex-col space-y-2 transition ${
                isDragging ? "ring-4 ring-blue-400 ring-inset" : ""
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <h3 className="text-lg font-semibold">Dodaj wspomnienie</h3>

            <input
                ref={titleRef}
                type="text"
                placeholder="Tytuł"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />

            <textarea
                placeholder="Opis"
                className="input min-h-[80px]"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
            />



            <div className="flex flex-col space-y-2">
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
                >
                    Dodaj lub upuść zdjęcia
                </label>
                <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles((prev) => [...prev, ...(Array.from(e.target.files || []))])}
                    className="hidden"
                />

                {/* Podgląd zdjęcia pod opisem */}
                {selectedImage && (
                    <div className="mb-4 relative rounded-xl overflow-hidden shadow-lg">
                        <img
                            src={selectedImage}
                            alt="Podgląd"
                            className="w-full max-h-[400px] object-contain bg-black"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded hover:bg-black/90 transition"
                        >
                            Zamknij podgląd
                        </button>
                    </div>
                )}

                {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {files.map((file, index) => {
                            const objectUrl = URL.createObjectURL(file);
                            return (
                                <div key={index} className="relative group">
                                    <img
                                        src={objectUrl}
                                        alt={`preview-${index}`}
                                        className="w-full aspect-[4/3] object-cover rounded shadow cursor-pointer"
                                        onClick={() => setSelectedImage(objectUrl)}
                                        title="Kliknij, aby powiększyć"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFiles(files.filter((_, i) => i !== index));
                                        }}
                                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                                        title="Usuń"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <input
                type="text"
                className="input"
                placeholder="Lokalizacja wskaźnika"
                value={position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : ""}
                readOnly
            />

            <button
                onClick={handleSubmit}
                className="btn-secondary mt-auto disabled:opacity-50"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Zapisywanie..." : "Zapisz wspomnienie"}
            </button>
        </div>
    );
}
