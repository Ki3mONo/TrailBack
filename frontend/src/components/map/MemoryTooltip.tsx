import { useEffect, useState } from "react";
import { MapRef } from "react-map-gl";

type Props = {
    mapRef: React.RefObject<MapRef>;
    lat: number;
    lng: number;
    title: string;
};

export default function MemoryTooltip({ mapRef, lat, lng, title }: Props) {
    const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;
        const point = mapRef.current.project({ lat, lng });
        setCoords({ x: point.x, y: point.y });
    }, [mapRef, lat, lng]);

    if (!coords) return null;

    return (
        <div
            className="absolute z-30"
            style={{
                left: coords.x,
                top: coords.y,
                transform: "translate(-50%, -100%)",
                pointerEvents: "none",
            }}
        >
            <div
                className="text-xs font-medium px-3 py-1 rounded-md shadow
                backdrop-blur-md border
                bg-white/90 text-gray-800
                dark:bg-[#2a2a2d] dark:text-white dark:border-white/20"
            >
                {title}
            </div>
        </div>
    );
}
