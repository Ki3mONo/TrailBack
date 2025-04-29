import { useState, useRef, useEffect } from "react";
import Map, { Marker, MapRef, ViewState, Source, Layer } from "react-map-gl";
import * as mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import LocationSearch from "./LocationSearch.tsx";
import MemoryForm from "../memories/MemoryForm.tsx";
import MemoriesList from "../memories/MemoriesList.tsx";
import MemoryTooltip from "../memories/MemoryTooltip.tsx";
import MemoryModal from "../memories/MemoryModal.tsx";

import { useMemories } from "../../hooks/useMemories.ts";
import { Memory, ViewMode } from "../../types/types.ts";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface MemoryMapViewProps {
    darkMode: boolean;
}

export default function MemoryMapView({ darkMode }: MemoryMapViewProps) {
    const [mode, setMode] = useState<ViewMode>("list");
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [hoveredMemoryId, setHoveredMemoryId] = useState<string | null>(null);
    const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
    const [showTrails, setShowTrails] = useState(false);
    const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
    const [isMobileView, setIsMobileView] = useState(false);

    const { memories, setMemories, currentUserId } = useMemories(mode);

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

    const fitMapToMemories = () => {
        if (mapRef.current && memories.length > 0) {
            const lats = memories.map((m) => m.lat);
            const lngs = memories.map((m) => m.lng);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);

            mapRef.current.fitBounds(
                [
                    [minLng, minLat],
                    [maxLng, maxLat],
                ],
                {
                    padding: {
                        top: 80,
                        bottom: 80,
                        left: isMobileView ? 80 : 480,
                        right: 80,
                    },
                    duration: 1000,
                }
            );
        }
    };

    const handleMapClick = (e: mapboxgl.MapLayerMouseEvent) => {
        if (mode === "add") {
            setPosition([e.lngLat.lat, e.lngLat.lng]);
        }
    };

    const resetMapView = () => {
        mapRef.current?.flyTo({
            center: [19.945, 50.0647],
            zoom: 6,
            bearing: 0,
            pitch: 0,
            essential: true,
        });
    };

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1200) {
                setIsLeftPanelOpen(false);
                setIsRightPanelOpen(false);
                setIsMobileView(true);
            } else {
                setIsLeftPanelOpen(true);
                setIsRightPanelOpen(true);
                setIsMobileView(false);
            }
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (memories.length > 0) {
            fitMapToMemories();
        }
    }, [memories, isMobileView]);

    return (
        <div className="relative w-full h-[calc(100vh-120px)] overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Map
                    {...viewState}
                    onMove={(evt) => setViewState(evt.viewState)}
                    onClick={handleMapClick}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    mapStyle={mapStyle}
                    ref={mapRef}
                    style={{ width: "100%", height: "100%" }}
                >
                    {mode === "add" && position && (
                        <Marker latitude={position[0]} longitude={position[1]}>
                            <div className="bg-red-500 w-5 h-5 rounded-full border-2 border-white" />
                        </Marker>
                    )}
                    {mode === "list" &&
                        memories.map((memory) => (
                            <Marker
                                key={memory.id}
                                latitude={memory.lat}
                                longitude={memory.lng}
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation();
                                    setSelectedMemory(memory);
                                    setViewState({
                                        ...viewState,
                                        latitude: memory.lat,
                                        longitude: memory.lng,
                                        zoom: 10,
                                    });
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
                    {hoveredMemoryId && mapRef.current && (() => {
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

            {(!isMobileView || (!isLeftPanelOpen && !isRightPanelOpen)) && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="flex bg-white dark:bg-gray-800 p-2 rounded-full shadow-md">
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
            )}

            {isLeftPanelOpen && (
                <div className="absolute top-4 left-4 z-10 w-[90vw] max-w-[400px] space-y-4 overflow-hidden p-2">
                    <LocationSearch
                        mapboxToken={MAPBOX_TOKEN}
                        onSelect={(lat, lng) => {
                            setViewState((prev) => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                zoom: 12,
                            }));
                            if (mode === "add") setPosition([lat, lng]);
                        }}
                    />
                    {mode === "list" && (
                        <div className="bg-white dark:bg-[#2a2a2d] p-4 rounded-xl shadow-lg max-h-[70vh] overflow-y-auto">
                            <MemoriesList memories={memories} onSelect={(memory) => {
                                setSelectedMemory(memory);
                                setViewState({
                                    ...viewState,
                                    latitude: memory.lat,
                                    longitude: memory.lng,
                                    zoom: 10,
                                });
                            }} />
                        </div>
                    )}
                </div>
            )}

            {isRightPanelOpen && mode === "add" && (
                <div className="absolute top-4 right-4 z-10 w-[90vw] max-w-[480px] overflow-hidden p-2">
                    <div className="bg-white dark:bg-[#2a2a2d] p-4 rounded-xl shadow-lg max-h-[70vh] overflow-y-auto">
                        <MemoryForm position={position} setPosition={setPosition} />
                    </div>
                </div>
            )}

            {(!isMobileView || (!isLeftPanelOpen && !isRightPanelOpen)) && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    <button
                        onClick={() => setShowTrails((prev) => !prev)}
                        className="bg-white dark:bg-gray-800 px-6 py-2 rounded-xl shadow-md text-sm font-medium"
                    >
                        {showTrails ? "Ukryj szlaki" : "Pokaż szlaki"}
                    </button>
                    <button
                        onClick={resetMapView}
                        className="bg-white dark:bg-gray-800 px-6 py-2 rounded-xl shadow-md text-sm font-medium"
                    >
                        Resetuj widok
                    </button>
                </div>
            )}

            {isMobileView && (
                <>
                    <button
                        onClick={() => setIsLeftPanelOpen(prev => !prev)}
                        className={`absolute top-1/2 z-20 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md flex items-center justify-center ${
                            isLeftPanelOpen ? "left-[410px]" : "left-2"
                        }`}
                    >
                        <i className={`bi ${isLeftPanelOpen ? "bi-chevron-left" : "bi-chevron-right"} text-xl`}></i>
                    </button>

                    <button
                        onClick={() => setIsRightPanelOpen(prev => !prev)}
                        className={`absolute top-1/2 z-20 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md flex items-center justify-center ${
                            isRightPanelOpen ? "right-[490px]" : "right-2"
                        }`}
                    >
                        <i className={`bi ${isRightPanelOpen ? "bi-chevron-right" : "bi-chevron-left"} text-xl`}></i>
                    </button>
                </>
            )}

            {selectedMemory && currentUserId && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedMemory(null)}
                >
                    <div
                        className="bg-white dark:bg-[#2a2a2d] max-w-5xl w-full rounded-xl shadow-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MemoryModal
                            memory={selectedMemory}
                            isShared={selectedMemory.isShared}
                            currentUserId={currentUserId}
                            onClose={() => setSelectedMemory(null)}
                            onDelete={() => {
                                setMemories(memories.filter((m) => m.id !== selectedMemory.id));
                                setSelectedMemory(null);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
