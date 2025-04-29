import { useState } from "react";
import { toast } from "react-toastify";

type Props = {
    memoryId: string;
    userId: string;
    onClose: () => void;
    onUploaded?: () => void;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function PhotoUploadModal({
                                             memoryId,
                                             userId,
                                             onClose,
                                             onUploaded,
                                         }: Props) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const handleUpload = async () => {
        if (files.length === 0) return toast.warn("Nie wybrano zdjęć.");
        setIsUploading(true);

        for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch(
                    `${backendUrl}/memories/${memoryId}/upload-photo?user_id=${userId}`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!res.ok) throw new Error("Błąd uploadu");

                toast.success(`Dodano zdjęcie: ${file.name}`);
            } catch {
                toast.error(`Błąd przy zdjęciu: ${file.name}`);
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
        const dropped = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith("image/")
        );
        if (dropped.length) {
            setFiles((prev) => [...prev, ...dropped]);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`bg-white dark:bg-[#2a2a2d] w-full max-w-xl p-6 rounded-xl shadow-lg space-y-4 transition ${
                    isDragging ? "ring-4 ring-blue-400 ring-inset" : ""
                }`}
            >
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Dodaj zdjęcia</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Zielony przycisk */}
                <label className="btn bg-blue-600 text-white hover:bg-green-700 w-full text-center cursor-pointer justify-center">
                    Wybierz z urządzenia lub przeciągnij
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files?.length) {
                                setFiles([...files, ...Array.from(e.target.files)]);
                            }
                        }}
                    />
                </label>

                {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                        {files.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                                <div
                                    key={idx}
                                    className="relative group aspect-[4/3] rounded shadow overflow-hidden cursor-pointer"
                                >
                                    <img
                                        src={url}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFiles((prev) =>
                                                prev.filter((_, i) => i !== idx)
                                            );
                                        }}
                                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Dodaj wszystkie zdjęcia */}
                <div className="flex justify-end">
                    <button
                        onClick={handleUpload}
                        className="btn-secondary disabled:opacity-50"
                        disabled={isUploading || files.length === 0}
                    >
                        {isUploading ? "Przesyłanie..." : "Dodaj wszystkie zdjęcia"}
                    </button>
                </div>
            </div>
        </div>
    );
}
