import { useState } from "react";

export default function LocationSearch({
                                           onSelect,
                                           mapboxToken
                                       }: {
    onSelect: (lat: number, lng: number) => void;
    mapboxToken: string;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5&language=pl`;

        const res = await fetch(url);
        const data = await res.json();
        setResults(data.features || []);
    };

    const handleSelect = (feature: any) => {
        const [lng, lat] = feature.center;
        onSelect(lat, lng);
        setResults([]);
        setQuery(feature.place_name);
    };

    return (
        <div className="absolute top-2 left-6 z-10 w-[24%] bg-[var(--card)] p-3 rounded-xl shadow-lg space-y-2">
            <input
                type="text"
                className="input"
                placeholder="Szukaj miejsca..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {results.length > 0 && (
                <ul className="bg-white dark:bg-gray-800 rounded shadow max-h-60 overflow-y-auto text-sm">
                    {results.map((feature) => (
                        <li
                            key={feature.id}
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleSelect(feature)}
                        >
                            {feature.place_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
