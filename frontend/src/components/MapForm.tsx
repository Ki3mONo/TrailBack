import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import LocationPicker from "./LocationPicker";
import { MapContainer, Marker, TileLayer } from "react-leaflet";

export default function MapForm({ darkMode }: { darkMode: boolean }) {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [date, setDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const titleRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTimeout(() => titleRef.current?.focus(), 300);
    }, []);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        const user = (await supabase.auth.getUser()).data.user;

        if (!user || !position || files.length === 0 || !date) {
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
            const memoryRes = await fetch(`${backendUrl}/memories`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(memoryPayload),
            });

            if (!memoryRes.ok) {
                const err = await memoryRes.json();
                toast.error("Błąd tworzenia wspomnienia: " + err.detail);
                setIsSubmitting(false);
                return;
            }

            memory = await memoryRes.json();
        } catch (err) {
            toast.error("Nie udało się połączyć z API.");
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

            if (!publicUrl) {
                toast.error("Brak publicznego URL dla zdjęcia: " + file.name);
                continue;
            }

            const photoPayload = {
                memory_id: memory.id,
                url: publicUrl,
                uploaded_by: user.id,
            };

            try {
                const photoRes = await fetch(`${backendUrl}/photos`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(photoPayload),
                });

                if (!photoRes.ok) {
                    const err = await photoRes.json();
                    toast.error("Błąd zapisu zdjęcia: " + err.detail);
                }
            } catch (err) {
                toast.error("Błąd komunikacji z API (photos)");
            }
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

            <div className="card p-0 overflow-hidden">
                <MapContainer center={[51.1079, 17.0385]} zoom={13} className="leaflet-container">
                    <TileLayer
                        url={
                            darkMode
                                ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                                : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        }
                    />
                    <LocationPicker onSelect={(lat, lng) => setPosition([lat, lng])} />
                    {position && <Marker position={position} />}
                </MapContainer>
            </div>

            <div className="card space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tytuł</label>
                    <input
                        ref={titleRef}
                        type="text"
                        placeholder="Nazwij swoje wspomnienie"
                        className="input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data wspomnienia</label>
                    <input
                        type="date"
                        className="input"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opis</label>
                    <textarea
                        placeholder="Opisz swoje wspomnienie"
                        className="input min-h-[120px]"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Zdjęcia</label>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0 file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    />
                </div>

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
