import { Memory } from "../../types/types";
import { formatPolishDate } from "../../utils/formatPolishDate";

export default function MemoriesList({
                                         memories,
                                         onSelect,
                                     }: {
    memories: Memory[];
    onSelect?: (memory: Memory) => void;
}) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Twoje wspomnienia</h2>

            {memories.length === 0 ? (
                <p className="text-gray-500">Brak wspomnień</p>
            ) : (
                <ul className="space-y-4">
                    {memories.map((memory) => (
                        <li
                            key={memory.id}
                            className={`p-4 rounded-xl bg-white dark:bg-gray-800 border-l-4 shadow transition cursor-pointer hover:shadow-xl ${
                                memory.isShared ? "border-blue-600" : "border-red-600"
                            }`}
                            onClick={() => onSelect?.(memory)}
                        >
                            <h3 className="text-lg font-semibold text-blue-700 dark:text-white flex items-center gap-2">
                                {memory.title}
                                {memory.isShared && (
                                    <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                                        Udostępnione
                                    </span>
                                )}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                📍 {memory.lat.toFixed(4)}, {memory.lng.toFixed(4)}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                {formatPolishDate(memory.created_at)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
