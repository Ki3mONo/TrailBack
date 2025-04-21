import { useEffect, useState } from "react";
import ImageModal from "./ImageModal";
import ShareMemoryModal from "./ShareMemoryModal";
import EditMemoryModal from "./EditMemoryModal";
import MemorySharingInfo from "./MemorySharingInfo";
import PhotoUploadModal from "./PhotoUploadModal";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

type Memory = {
    id: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    created_by: string;
};

type Photo = {
    id: string;
    memory_id: string;
    url: string;
    uploaded_by: string;
};

type Props = {
    memory: Memory;
    isShared: boolean;
    onClose: () => void;
    onDelete: () => void;
};

export default function MemoryModal({
                                        memory,
                                        isShared,
                                        onClose,
                                        onDelete,
                                    }: Props) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [photoModalOpen, setPhotoModalOpen] = useState(false);

    const fetchPhotos = async () => {
        try {
            const res = await fetch(`${backendUrl}/photos?memory_id=${memory.id}`);
            const data = await res.json();
            setPhotos(Array.isArray(data) ? data : []);
        } catch {
            toast.error("Błąd ładowania zdjęć");
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [memory.id]);

    const deletePhoto = async (photoId: string) => {
        try {
            await fetch(
                `${backendUrl}/memories/${memory.id}/photo/${photoId}?user_id=${memory.created_by}`,
                { method: "DELETE" }
            );
            toast.success("Usunięto zdjęcie");
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch {
            toast.error("Błąd usuwania zdjęcia");
        }
    };

    const deleteMemory = async () => {
        if (!confirm("Na pewno chcesz usunąć wspomnienie?")) return;

        try {
            await fetch(`${backendUrl}/memories/${memory.id}?user_id=${memory.created_by}`, {
                method: "DELETE",
            });
            toast.success("Usunięto wspomnienie");
            onClose();
            onDelete();
        } catch {
            toast.error("Błąd usuwania wspomnienia");
        }
    };

    return (
        <div className="p-6 space-y-6">
            {previewUrl && (
                <ImageModal
                    url={previewUrl}
                    onClose={() => setPreviewUrl(null)}
                    allImages={photos.map((p) => p.url)}
                    memoryName={memory.title}
                    onDelete={(url) => {
                        const photo = photos.find((p) => p.url === url);
                        if (photo) deletePhoto(photo.id);
                        setPreviewUrl(null);
                    }}
                />
            )}

            {shareOpen && (
                <ShareMemoryModal
                    memoryId={memory.id}
                    onClose={() => setShareOpen(false)}
                />
            )}

            {editOpen && (
                <EditMemoryModal
                    memoryId={memory.id}
                    initialTitle={memory.title}
                    initialDescription={memory.description}
                    userId={memory.created_by}
                    onClose={() => setEditOpen(false)}
                    onSave={(title, desc) => {
                        memory.title = title;
                        memory.description = desc;
                    }}
                />
            )}

            {photoModalOpen && (
                <PhotoUploadModal
                    memoryId={memory.id}
                    userId={memory.created_by}
                    onClose={() => setPhotoModalOpen(false)}
                    onUploaded={fetchPhotos}
                />
            )}

            {/* Nagłówek */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{memory.title}</h2>
                {isShared && (
                    <span className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
            Udostępnione
          </span>
                )}
            </div>

            {memory.description && (
                <p className="text-gray-700 dark:text-gray-200">{memory.description}</p>
            )}

            {/* Zdjęcia + Sharing info */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-1">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative aspect-[4/3] overflow-hidden rounded shadow-md cursor-zoom-in group"
                                onClick={() => setPreviewUrl(photo.url)}
                            >
                                <img
                                    src={`${photo.url}?width=300&quality=30`}
                                    alt="Zdjęcie"
                                    className="w-full h-full object-cover blur-sm opacity-0 transition duration-500"
                                    onLoad={(e) =>
                                        e.currentTarget.classList.remove("blur-sm", "opacity-0")
                                    }
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deletePhoto(photo.id);
                                    }}
                                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                                >
                                    Usuń
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-1 min-w-[180px]">
                    <MemorySharingInfo memoryId={memory.id} ownerId={memory.created_by} />
                </div>
            </div>

            {/* Akcje */}
            <div className="flex justify-between items-center mt-4">
                <button className="btn-outline" onClick={onClose}>
                    Powrót
                </button>

                <div className="flex items-center gap-2">
                    <button onClick={() => setPhotoModalOpen(true)} className="btn-outline">
                        Dodaj zdjęcia
                    </button>

                    <button onClick={() => setEditOpen(true)} className="btn-outline">
                        Edytuj wspomnienie
                    </button>

                    <button onClick={() => setShareOpen(true)} className="btn-outline">
                        Udostępnij
                    </button>

                    <button onClick={deleteMemory} className="btn bg-red-600 text-white">
                        Usuń
                    </button>
                </div>
            </div>
        </div>
    );
}
