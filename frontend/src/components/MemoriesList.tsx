import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { toast } from "react-toastify";
import MemoryModal from "./MemoryModal";

type MemoryBase = {
    id: string;
    title: string;
    description?: string;
    lat: number;
    lng: number;
    created_at?: string;
    created_by: string;
};

type ExtendedMemory = MemoryBase & {
    isShared: boolean;
};

export default function MemoriesList({ darkMode }: { darkMode: boolean }) {
    const [selected, setSelected] = useState<ExtendedMemory | null>(null);
    const [memories, setMemories] = useState<ExtendedMemory[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>("");
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
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

    const fetchMemories = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return toast.error("Użytkownik niezalogowany");

            setCurrentUserId(user.id);

            const ownRes = await fetch(`${backendUrl}/memories?user_id=${user.id}`);
            const ownMemories = await ownRes.json();

            const sharedRes = await fetch(`${backendUrl}/memories/shared?user_id=${user.id}`);
            const sharedMemories = await sharedRes.json();

            const combined = [...ownMemories, ...sharedMemories];

            const uniqueMemories = combined.filter(
                (value, index, self) =>
                    index === self.findIndex((m) => m.id === value.id)
            );

            setMemories(uniqueMemories.map(m => ({
                ...m,
                isShared: m.created_by !== user.id
            })));
        } catch (err) {
            toast.error("Błąd ładowania wspomnień");
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemories();
    }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Twoje wspomnienia</h2>

            {loading ? (
                <p className="text-gray-500 animate-pulse">Ładowanie wspomnień...</p>
            ) : memories.length === 0 ? (
                <p className="text-gray-500">Brak wspomnień</p>
            ) : (
                <ul className="memory-grid">
                    {memories.map((memory) => {
                        const isShared = memory.created_by !== currentUserId;

                        return (
                            <li
                                key={memory.id}
                                className={`memory-item relative cursor-pointer hover:shadow-xl transition border-l-4 ${
                                    isShared ? "border-blue-600" : "border-red-600"
                                }`}
                                onClick={() =>
                                    setSelected({ ...memory, isShared })
                                }
                            >
                                <h3 className="text-lg font-semibold text-blue-700 dark:text-white flex items-center gap-2">
                                    {memory.title}
                                    {isShared && (
                                        <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                                            Udostępnione
                                        </span>
                                    )}
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
                        );
                    })}
                </ul>
            )}

            {selected && (
                <MemoryModal
                    memory={selected}
                    isShared={selected.isShared}
                    onClose={() => setSelected(null)}
                    onDelete={fetchMemories}
                    darkMode={darkMode}
                />
            )}
        </div>
    );
}
