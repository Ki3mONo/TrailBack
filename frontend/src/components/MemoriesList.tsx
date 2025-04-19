import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ImageModal from "./ImageModal";
import { toast } from "react-toastify";

type Memory = {
    id: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    created_at?: string;
    created_by?: string;
};

type Photo = {
    id: string;
    memory_id: string;
    url: string;
    uploaded_by: string;
    uploaded_at: string;
};

export default function MemoriesList({ darkMode }: { darkMode: boolean }) {
    const [memories, setMemories] = useState<Memory[]>([]);
    const [selected, setSelected] = useState<Memory | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const formatPolishDate = (dateString: string) => {
        if (!dateString) return "?";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "?";

        const dayName = date.toLocaleDateString("pl-PL", { weekday: "long" });
        const monthName = date.toLocaleDateString("pl-PL", { month: "long" });
        const day = date.getDate();
        const year = date.getFullYear();

        return `${capitalize(dayName)} ${day} ${monthName} ${year}`;
    };

    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    useEffect(() => {
        const fetchMemories = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    toast.error("Użytkownik niezalogowany.");
                    return;
                }

                console.log("➡️ Fetching memories for:", user.id);
                const res = await fetch(`${backendUrl}/memories?user_id=${user.id}`);

                if (!res.ok) {
                    const err = await res.json();
                    console.error("❌ Błąd API memories:", err);
                    toast.error("Nie udało się pobrać wspomnień.");
                    return;
                }

                const data = await res.json();
                if (Array.isArray(data)) {
                    setMemories(data);
                } else {
                    toast.error("Odpowiedź z serwera ma nieprawidłowy format.");
                }
            } catch (err) {
                console.error("❌ Błąd pobierania wspomnień:", err);
                toast.error("Wystąpił błąd podczas pobierania wspomnień.");
            } finally {
                setLoading(false);
            }
        };

        fetchMemories();
    }, [backendUrl]);

    const openMemory = async (memory: Memory) => {
        setSelected(memory);
        setLoadingPhotos(true);
        try {
            const res = await fetch(`${backendUrl}/photos?memory_id=${memory.id}`);

            if (!res.ok) {
                toast.error("Nie udało się pobrać zdjęć.");
                return;
            }

            const data = await res.json();
            setPhotos(data);
        } catch (err) {
            console.error("❌ Błąd pobierania zdjęć:", err);
            toast.error("Wystąpił błąd podczas pobierania zdjęć.");
        } finally {
            setLoadingPhotos(false);
        }
    };

    return (
        <div className="fade-in space-y-6 relative">
            {previewUrl && selected && (
                <ImageModal
                    url={previewUrl}
                    onClose={() => setPreviewUrl(null)}
                    allImages={photos.map((p) => p.url)}
                    memoryName={selected.title} // ✅ Naprawa: wymagany prop przekazany
                />
            )}


            {!previewUrl && (
                <>
                    <h2 className="text-2xl font-bold">Twoje wspomnienia</h2>

                    {selected ? (
                        <div className="card space-y-4">
                            <h3 className="text-xl font-semibold">{selected.title}</h3>
                            {selected.description && (
                                <p className="text-gray-700">{selected.description}</p>
                            )}

                            <MapContainer
                                center={[selected.lat, selected.lng]}
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
                                <Marker position={[selected.lat, selected.lng]} />
                            </MapContainer>

                            {loadingPhotos ? (
                                    <p className="text-sm text-gray-400">Ładowanie zdjęć...</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {photos.map((photo) => (
                                            <div
                                                key={photo.id}
                                                className="relative aspect-[4/3] overflow-hidden rounded shadow-md cursor-zoom-in hover:scale-[1.01] transition-transform"
                                                onClick={() => setPreviewUrl(photo.url)}
                                            >
                                                <img
                                                    src={`${photo.url}?width=300&quality=30`}
                                                    alt="Wspomnienie"
                                                    loading="lazy"
                                                    className="w-full h-full object-cover blur-sm opacity-0 transition duration-500"
                                                    onLoad={(e) => e.currentTarget.classList.remove("blur-sm", "opacity-0")}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}


                                <button
                                onClick={() => setSelected(null)}
                                className="btn-outline mt-4 w-full"
                            >
                                ← Wróć do listy
                            </button>
                        </div>
                    ) : loading ? (
                        <p className="text-gray-500 animate-pulse">Ładowanie wspomnień...</p>
                    ) : memories.length === 0 ? (
                        <p className="text-gray-500">Brak wspomnień</p>
                    ) : (
                        <ul className="memory-grid">
                            {memories.map((memory) => (
                                <li
                                    key={memory.id}
                                    className="memory-item cursor-pointer hover:shadow-xl transition"
                                    onClick={() => openMemory(memory)}
                                >
                                    <h3 className="text-lg font-semibold text-blue-700">
                                        {memory.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        📍 {memory.lat.toFixed(4)}, {memory.lng.toFixed(4)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {memory.created_at
                                            ? formatPolishDate(memory.created_at)
                                            : "?"}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </div>
    );
}
