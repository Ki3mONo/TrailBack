import { useState, useRef, useEffect } from "react";
import Map, { Marker, MapRef } from "react-map-gl";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import LocationSearch from "./LocationSearch";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapForm({ darkMode }: { darkMode: boolean }) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [viewState, setViewState] = useState({
        latitude: 50.0647,
        longitude: 19.945,
        zoom: 6,
    });
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    const titleRef = useRef<HTMLInputElement>(null);
    const mapRef = useRef<MapRef>(null);

    useEffect(() => {
        setTimeout(() => titleRef.current?.focus(), 300);
    }, []);

    const mapStyle = darkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v12";

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const user = (await supabase.auth.getUser()).data.user;
        if (!user || !position || files.length === 0 || !date || !title) {
            toast.error("Uzupełnij wszystkie dane, wybierz lokalizację, datę i zdjęcia.");
            setIsSubmitting(false);
            return;
        }

        const memoryPayload = {
            title,
            description: desc,
            lat: position[0],
            lng: position[1],
            created_by: user.id,
            created_at: new Date(date).toISOString(),
        };

        let memory;
        try {
            const res = await fetch(`${backendUrl}/memories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(memoryPayload),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw { detail: errorData?.detail || "Nieznany błąd z API." };
            }

            memory = await res.json();
        } catch (err: any) {
            toast.error("Błąd: " + (err?.detail || "Nie udało się zapisać wspomnienia"));
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
        setIsSubmitting(false);
    };

    return (
        <div className="relative w-full h-[calc(100vh-88px)] overflow-hidden">
            {/* Mapa */}
            <div className="absolute inset-0 z-0 px-4">
                <div className="w-full h-[90%] rounded-xl overflow-hidden shadow">
                    <Map
                        {...viewState}
                        onMove={(evt) => setViewState(evt.viewState)}
                        onClick={(e) => setPosition([e.lngLat.lat, e.lngLat.lng])}
                        mapboxAccessToken={mapboxToken}
                        mapStyle={mapStyle}
                        ref={mapRef}
                        style={{ width: "100%", height: "100%" }}
                    >
                        {position && (
                            <Marker latitude={position[0]} longitude={position[1]}>
                                <div
                                    style={{
                                        backgroundColor: "red",
                                        borderRadius: "50%",
                                        width: 20,
                                        height: 20,
                                        border: "2px solid white",
                                    }}
                                />
                            </Marker>
                        )}
                    </Map>
                </div>
            </div>

            {/* Szukajka po lewej */}
            <LocationSearch
                mapboxToken={mapboxToken}
                onSelect={(lat, lng) => {
                    mapRef.current?.flyTo({
                        center: [lng, lat],
                        zoom: 12,
                        duration: 1000,
                    });
                    setPosition([lat, lng]);
                }}
            />

            {/* Formularz po prawej */}
            <div className="absolute top-2 right-6 z-10 w-[22%] h-[50%] bg-[var(--card)] p-4 rounded-xl shadow-lg flex flex-col space-y-3 overflow-auto">
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
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
                <input
                    type="text"
                    className="input"
                    placeholder="Lokalizacja wskaźnika"
                    value={
                        position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : ""
                    }
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
        </div>
    );
}
