import { useEditMemory } from "../../hooks/memory/useEditMemory.ts";

type Props = {
    memoryId: string;
    initialTitle: string;
    initialDescription?: string;
    userId: string;
    onClose: () => void;
    onSave: (title: string, description?: string) => void;
};

export default function EditMemoryModal({
                                            memoryId,
                                            initialTitle,
                                            initialDescription = "",
                                            userId,
                                            onClose,
                                            onSave,
                                        }: Props) {
    const {
        title,
        setTitle,
        description,
        setDescription,
        loading,
        handleSubmit,
    } = useEditMemory(memoryId, userId, onSave, onClose, initialTitle, initialDescription);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-md p-6 rounded-xl shadow-xl space-y-5">
                <h3 className="text-xl font-semibold">Edytuj wspomnienie</h3>

                <input
                    className="input w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Tytuł"
                />

                <textarea
                    className="input w-full min-h-[120px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opis (opcjonalnie)"
                />

                <div className="flex justify-end gap-2 pt-4">
                    <button onClick={onClose} className="btn-outline">
                        Anuluj
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn bg-blue-600 text-white"
                        disabled={loading}
                    >
                        {loading ? "Zapisywanie..." : "Zapisz"}
                    </button>
                </div>
            </div>
        </div>
    );
}
