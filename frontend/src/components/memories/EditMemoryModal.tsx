import { useState } from "react";
import { toast } from "react-toastify";

type Props = {
    memoryId: string;
    initialTitle: string;
    initialDescription?: string;
    userId: string;
    onClose: () => void;
    onSave: (title: string, description?: string) => void;
};

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function EditMemoryModal({
                                            memoryId,
                                            initialTitle,
                                            initialDescription = "",
                                            userId,
                                            onClose,
                                            onSave,
                                        }: Props) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Tytuł nie może być pusty");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${backendUrl}/memories/${memoryId}/edit?user_id=${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description }),
            });

            if (!res.ok) throw new Error();
            toast.success("Wspomnienie zaktualizowane");
            onSave(title, description);
            onClose();
        } catch {
            toast.error("Błąd zapisu zmian");
        } finally {
            setLoading(false);
        }
    };

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
