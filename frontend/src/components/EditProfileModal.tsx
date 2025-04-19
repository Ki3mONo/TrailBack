import { useEffect, useRef, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

type Props = {
    userId: string;
    initial: {
        full_name: string;
        username: string;
        avatar_url?: string;
    };
    onClose: () => void;
    onSaved: () => void;
};

const EditProfileModal = ({ userId, initial, onClose, onSaved }: Props) => {
    const [form, setForm] = useState({ ...initial });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.avatar_url || "/placeholder-avatar.png");
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (avatarFile) {
            const url = URL.createObjectURL(avatarFile);
            setAvatarPreview(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setAvatarPreview(initial.avatar_url || "/placeholder-avatar.png");
        }
    }, [avatarFile, initial.avatar_url]);

    const handleSave = async () => {
        try {
            await axios.put(`${API_BASE}/profile`, form, {
                params: { user_id: userId },
            });

            if (avatarFile) {
                const fd = new FormData();
                fd.append("file", avatarFile);
                fd.append("user_id", userId);

                await axios.post(`${API_BASE}/profile/avatar`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            onSaved(); // odśwież profil
            onClose(); // zamknij modal
        } catch (err) {
            console.error("Błąd zapisu profilu:", err);
            alert("Nie udało się zapisać profilu.");
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) {
            onClose();
        }
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
                <h2 className="text-xl font-bold mb-4 text-center">Edytuj profil</h2>

                <div className="flex flex-col items-center gap-4 mb-4">
                    <div className="w-28 h-28 rounded-full overflow-hidden shadow border border-gray-300 dark:border-gray-600">
                        <img
                            src={avatarPreview || "/placeholder-avatar.png"}
                            alt="Podgląd avatar"
                            className="object-cover w-full h-full"
                        />
                    </div>

                    <input
                        type="file"
                        accept="image/png, image/jpeg"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                    />
                </div>

                <div className="space-y-3">
                    <input
                        className="input"
                        placeholder="Imię i nazwisko"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    />
                    <input
                        className="input"
                        placeholder="Nazwa użytkownika"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="btn border bg-gray-200 dark:bg-gray-700"
                    >
                        ✖ Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn bg-blue-600 text-white hover:bg-blue-700"
                    >
                        💾 Zapisz
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
