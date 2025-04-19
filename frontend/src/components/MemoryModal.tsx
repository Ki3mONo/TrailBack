import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import ShareMemoryModal from "./ShareMemoryModal";
import ImageModal from "./ImageModal";
import { toast } from "react-toastify";

type Memory = {
    id: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    created_at?: string;
};

type Photo = {
    id: string;
    memory_id: string;
    url: string;
    uploaded_by: string;
    uploaded_at?: string;
};

export default function MemoryModal({
                                        memory,
                                        onClose,
                                        onDelete,
                                        darkMode,
                                    }: {
    memory: Memory;
    onClose: () => void;
    onDelete: () => void;
    darkMode: boolean;
}) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const getUserOrThrow = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.id) {
            toast.error("Brak zalogowanego użytkownika");
            throw new Error("Brak zalogowanego użytkownika");
        }
        return user;
    };

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const res = await fetch(`${backendUrl}/photos?memory_id=${memory.id}`);
                const data = await res.json();
                setPhotos(Array.isArray(data) ? data : []);
            } catch {
                toast.error("Błąd ładowania zdjęć");
            }
        };
        fetchPhotos();
    }, [memory.id]);

    const uploadPhotoViaApi = async (file: File) => {
        try {
            const user = await getUserOrThrow();

            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                `${backendUrl}/memories/${memory.id}/upload-photo?user_id=${user.id}`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            if (res.ok) {
                const data = await res.json();
                setPhotos((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        memory_id: memory.id,
                        url: data.url,
                        uploaded_by: user.id,
                    },
                ]);
                toast.success("Zdjęcie dodane!");
            } else {
                toast.error("Błąd przesyłania zdjęcia");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deletePhoto = async (photoId: string) => {
        try {
            const user = await getUserOrThrow();
            await fetch(
                `${backendUrl}/memories/${memory.id}/photo/${photoId}?user_id=${user.id}`,
                { method: "DELETE" }
            );
            toast.success("Usunięto zdjęcie");
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch {
            toast.error("Błąd usuwania zdjęcia");
        }
    };

    const deleteMemory = async () => {
        const confirmed = confirm("Na pewno chcesz usunąć wspomnienie?");
        if (!confirmed) return;

        try {
            const user = await getUserOrThrow();
            await fetch(`${backendUrl}/memories/${memory.id}?user_id=${user.id}`, {
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
        <div className="modal-backdrop z-40">
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

            <div className="modal-content space-y-4">
                <h3 className="text-xl font-semibold">{memory.title}</h3>
                {memory.description && (
                    <p className="text-gray-700">{memory.description}</p>
                )}

                <MapContainer
                    center={[memory.lat, memory.lng]}
                    zoom={14}
                    style={{ height: "200px" }}
                    className="rounded border"
                >
                    <TileLayer
                        url={
                            darkMode
                                ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        }
                    />
                    <Marker position={[memory.lat, memory.lng]} />
                </MapContainer>

                {/* Upload */}
                <div className="flex justify-end mt-2">
                    <label className="btn cursor-pointer">
                        ➕ Dodaj zdjęcie
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    uploadPhotoViaApi(e.target.files[0]);
                                    e.target.value = "";
                                }
                            }}
                        />
                    </label>
                </div>

                {/* Gallery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

                <div className="flex justify-between gap-2">
                    <button onClick={onClose} className="btn-outline">
                        ← Powrót
                    </button>
                    <button onClick={() => setShareOpen(true)} className="btn-outline">
                        Udostępnij
                    </button>
                    <button onClick={deleteMemory} className="btn bg-red-600 text-white">
                        Usuń wspomnienie
                    </button>
                </div>
            </div>
        </div>
    );
}
