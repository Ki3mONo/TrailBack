import { useState, useRef, useEffect } from "react";
import Map, { Marker, MapRef } from "react-map-gl";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import "mapbox-gl/dist/mapbox-gl.css";

export default function MapForm({ darkMode }: { darkMode: boolean }) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [viewState, setViewState] = useState({
        latitude: 51.1079,
        longitude: 17.0385,
        zoom: 13,
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
                if (errorData?.detail) {
                    throw { detail: errorData.detail };
                }
                throw new Error("Nieznany błąd z API.");
            }

            memory = await res.json();
        } catch (err) {
            if (err && typeof err === "object" && "detail" in err) {
                toast.error("Błąd tworzenia wspomnienia: " + (err as { detail: string }).detail);
            } else {
                toast.error("Błąd tworzenia wspomnienia.");
            }
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
        <div className="fade-in space-y-6">
            <h3 className="text-2xl font-bold">Dodaj nowe wspomnienie</h3>

            <div className="rounded overflow-hidden">
                <Map
                    {...viewState}
                    onMove={(evt) => setViewState(evt.viewState)}
                    onClick={(e) => setPosition([e.lngLat.lat, e.lngLat.lng])}
                    mapboxAccessToken={mapboxToken}
                    mapStyle={mapStyle}
                    ref={mapRef}
                    style={{ height: "800px", width: "100%" }}
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

            <div className="card space-y-4">
                <input
                    ref={titleRef}
                    type="text"
                    placeholder="Tytuł wspomnienia"
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
                    className="input min-h-[120px]"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                />
                <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />

                <button
                    onClick={handleSubmit}
                    className="btn-secondary w-full mt-4 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Dodawanie..." : "Zapisz wspomnienie"}
                </button>
            </div>
        </div>
    );
}
