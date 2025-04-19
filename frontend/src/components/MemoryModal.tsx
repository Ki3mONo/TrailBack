import { useEffect, useRef, useState } from "react";
import Map, { Marker, MapRef, Source, Layer } from "react-map-gl";
import { supabase } from "../supabaseClient";
import ShareMemoryModal from "./ShareMemoryModal";
import ImageModal from "./ImageModal";
import { toast } from "react-toastify";
import "mapbox-gl/dist/mapbox-gl.css";

type Memory = {
    id: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    created_at?: string;
    created_by?: string;
    isShared?: boolean;
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
                                        isShared,
                                        onClose,
                                        onDelete,
                                        darkMode,
                                    }: {
    memory: Memory;
    isShared: boolean;
    onClose: () => void;
    onDelete: () => void;
    darkMode: boolean;
}) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [showTrails, setShowTrails] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const mapRef = useRef<MapRef>(null);

    const [viewState, setViewState] = useState({
        latitude: memory.lat,
        longitude: memory.lng,
        zoom: 8,
    });

    const mapStyle = darkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v12";

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

    const getUserOrThrow = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.id) {
            toast.error("Brak zalogowanego użytkownika");
            throw new Error("Brak zalogowanego użytkownika");
        }
        return user;
    };

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
        if (!confirm("Na pewno chcesz usunąć wspomnienie?")) return;

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

    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [memory.lng, memory.lat],
                zoom: 8,
                duration: 1000,
            });
        }
    }, [memory.id]);
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

                <Map
                    {...viewState}
                    onMove={(e) => setViewState(e.viewState)}
                    mapboxAccessToken={mapboxToken}
                    mapStyle={mapStyle}
                    ref={mapRef}
                    style={{ height: 300, width: "100%", borderRadius: 8 }}
                >
                    <Marker latitude={memory.lat} longitude={memory.lng}>
                        <div
                            style={{
                                backgroundColor: isShared ? "#3B82F6" : "#DC2626",
                                borderRadius: "50%",
                                width: 16,
                                height: 16,
                                border: "2px solid white",
                            }}
                        />
                    </Marker>

                    {/* Szlaki piesze z Waymarked Trails */}
                    {showTrails && (
                        <>
                            <Source
                                id="waymarked-hiking"
                                type="raster"
                                tiles={["https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"]}
                                tileSize={256}
                            />
                            <Layer
                                id="waymarked-hiking-layer"
                                type="raster"
                                source="waymarked-hiking"
                            />
                        </>
                    )}
                    <Layer
                        id="waymarked-hiking-layer"
                        type="raster"
                        source="waymarked-hiking"
                    />
                </Map>


                <div className="flex justify-between items-center mt-2">
                    <button
                        className="btn-outline"
                        onClick={() => setShowTrails(!showTrails)}
                    >
                        {showTrails ? "Ukryj szlaki" : "Pokaż szlaki"}
                    </button>

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
