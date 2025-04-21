import { useState, useRef, useEffect } from "react";
import Map, { Marker, MapRef, ViewState, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import LocationSearch from "./LocationSearch";
import MemoryForm from "./MemoryForm";
import MemoriesList from "./MemoriesList";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import MemoryTooltip from "./MemoryTooltip";
import MemoryModal from "./MemoryModal";

type Memory = {
    id: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    created_by: string;
    created_at?: string;
    isShared: boolean;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MemoryMapView({ darkMode }: { darkMode: boolean }) {
    const [mode, setMode] = useState<"list" | "add">("list");
    const [memories, setMemories] = useState<Memory[]>([]);
    const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
    const [hoveredMemoryId, setHoveredMemoryId] = useState<string | null>(null);
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [showTrails, setShowTrails] = useState(false);

    const [viewState, setViewState] = useState<ViewState>({
        latitude: 50.0647,
        longitude: 19.945,
        zoom: 6,
        bearing: 0,
        pitch: 0,
        padding: { top: 50, bottom: 50, left: 0, right: 0 },
    });

    const mapRef = useRef<MapRef>(null);
    const mapStyle = darkMode
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/outdoors-v12";

    const fetchMemories = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return toast.error("Użytkownik niezalogowany");

            const own = await fetch(`${backendUrl}/memories?user_id=${user.id}`).then(res => res.json());
            const shared = await fetch(`${backendUrl}/memories/shared?user_id=${user.id}`).then(res => res.json());

            const combined = [...own, ...shared];
            const unique = combined.filter((value, index, self) =>
                index === self.findIndex((m) => m.id === value.id)
            );

            const withFlags = unique.map((m) => ({
                ...m,
                isShared: m.created_by !== user.id,
            }));

            setMemories(withFlags);
        } catch (err) {
            toast.error("Błąd ładowania wspomnień");
            console.error(err);
        }
    };
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setSelectedMemory(null);
        };

        window.addEventListener("keydown", handleKeyDown);

        if (mode === "list") {
            fetchMemories();
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [mode]);

    const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
        if (mode === "add") {
            setPosition([e.lngLat.lat, e.lngLat.lng]);
        }
    };

    return (
        <div className="relative w-full h-[calc(100vh-120px)]">
            <div className="w-full h-full rounded-xl overflow-hidden">
                <Map
                    {...viewState}
                    onMove={(evt) => setViewState(evt.viewState)}
                    onClick={handleMapClick}
                    mapboxAccessToken={mapboxToken}
                    mapStyle={mapStyle}
                    ref={mapRef}
                    style={{ width: "100%", height: "100%" }}
                >
                    {/* Marker dodawania */}
                    {mode === "add" && position && (
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

                    {/* Markery wspomnień */}
                    {mode === "list" &&
                        memories.map((memory) => (
                            <Marker
                                key={memory.id}
                                latitude={memory.lat}
                                longitude={memory.lng}
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedMemory(memory);
                                    setViewState((prev) => ({
                                        ...prev,
                                        latitude: memory.lat,
                                        longitude: memory.lng,
                                        zoom: 10,
                                    }));
                                }}
                            >
                                <div
                                    onMouseEnter={() => setHoveredMemoryId(memory.id)}
                                    onMouseLeave={() => setHoveredMemoryId(null)}
                                    className={`w-4 h-4 rounded-full border-2 border-white cursor-pointer ${
                                        memory.isShared ? "bg-blue-500" : "bg-red-600"
                                    }`}
                                />
                            </Marker>
                        ))}

                    {/* Elegancki tooltip */}
                    {hoveredMemoryId && mode === "list" && mapRef.current && (() => {
                        const mem = memories.find((m) => m.id === hoveredMemoryId);
                        if (!mem) return null;
                        return (
                            <MemoryTooltip
                                mapRef={mapRef}
                                lat={mem.lat}
                                lng={mem.lng}
                                title={mem.title}
                            />
                        );
                    })()}

                    {/* Szlaki turystyczne */}
                    {showTrails && (
                        <>
                            <Source
                                id="waymarked-hiking"
                                type="raster"
                                tiles={["https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png"]}
                                tileSize={256}
                            />
                            <Layer id="waymarked-hiking-layer" type="raster" source="waymarked-hiking" />
                        </>
                    )}
                </Map>
            </div>

            {/* Modal wspomnienia */}
            {selectedMemory && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedMemory(null)} // ⬅️ kliknięcie poza
                >
                    <div
                        className="bg-white dark:bg-[#2a2a2d] max-w-5xl w-full rounded-xl shadow-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()} // ⬅️ nie zamyka, jeśli klikniesz modal
                    >
                        <MemoryModal
                            memory={selectedMemory}
                            isShared={selectedMemory.isShared}
                            onClose={() => setSelectedMemory(null)}
                            onDelete={() => {
                                setMemories(memories.filter(m => m.id !== selectedMemory.id));
                                setSelectedMemory(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Górny przełącznik trybu */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
                <div className="bg-white dark:bg-gray-800 p-1 rounded-full shadow-md flex">
                    <button
                        onClick={() => setMode("list")}
                        className={`px-4 py-1 rounded-full transition ${
                            mode === "list" ? "bg-blue-500 text-white" : "text-gray-500"
                        }`}
                    >
                        Moje wspomnienia
                    </button>
                    <button
                        onClick={() => {
                            setMode("add");
                            setSelectedMemory(null);
                        }}
                        className={`px-4 py-1 rounded-full transition ${
                            mode === "add" ? "bg-blue-500 text-white" : "text-gray-500"
                        }`}
                    >
                        Dodaj wspomnienie
                    </button>
                </div>
            </div>

            {/* Szukajka */}
            <div className="absolute top-4 left-4 z-30 w-[400px]">
                <LocationSearch
                    mapboxToken={mapboxToken}
                    onSelect={(lat, lng) => {
                        setViewState((prev) => ({
                            ...prev,
                            latitude: lat,
                            longitude: lng,
                            zoom: 12,
                        }));
                        if (mode === "add") {
                            setPosition([lat, lng]);
                        }
                    }}
                />
            </div>

            {/* Lista wspomnień */}
            {mode === "list" && (
                <div className="absolute top-[100px] left-4 z-20 w-[400px] bg-white dark:bg-[#2a2a2d] p-4 rounded-xl shadow-lg max-h-[70vh] overflow-y-auto">
                    <MemoriesList
                        memories={memories}
                        onSelect={(memory) => {
                            setViewState({
                                ...viewState,
                                latitude: memory.lat,
                                longitude: memory.lng,
                                zoom: 10,
                            });
                            setSelectedMemory(memory);
                        }}
                    />
                </div>
            )}

            {/* Formularz */}
            {mode === "add" && (
                <div className="absolute top-4 right-4 z-20 w-[480px]">
                    <div className="bg-white dark:bg-[#2a2a2d] p-4 rounded-xl shadow-lg max-h-[calc(100vh-120px-32px)] overflow-y-auto">
                        <MemoryForm position={position} setPosition={setPosition} />
                    </div>
                </div>
            )}

            {/* Przycisk szlaków */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
                <button
                    className="bg-white dark:bg-gray-800 px-6 py-2 rounded-xl shadow-md text-sm font-medium"
                    onClick={() => setShowTrails((prev) => !prev)}
                >
                    {showTrails ? "Ukryj szlaki turystyczne" : "Pokaż szlaki turystyczne"}
                </button>
                <button
                    className="bg-white dark:bg-gray-800 px-6 py-2 rounded-xl shadow-md text-sm font-medium ml-2"
                    onClick={() => {
                        mapRef.current?.flyTo({
                            center: [19.945, 50.0647],
                            zoom: 6,
                            bearing: 0,
                            pitch: 0,
                            essential: true,
                        });
                    }}
                >
                    Resetuj widok mapy
                </button>
            </div>
        </div>
    );
}
