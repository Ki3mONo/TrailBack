import { useRef, useState } from "react";
import axios from "axios";
import Cropper from "react-easy-crop";
import { Area } from "react-easy-crop";

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

const getCroppedImg = async (imageSrc: string, croppedAreaPixels: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas context");

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
    );

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
        }, "image/jpeg");
    });
};

const EditProfileModal = ({ userId, initial, onClose, onSaved }: Props) => {
    const [form, setForm] = useState({ ...initial });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const overlayRef = useRef<HTMLDivElement>(null);

    const onCropComplete = (_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setImageUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            await axios.put(`${API_BASE}/profile`, form, {
                params: { user_id: userId },
            });

            if (selectedFile && croppedAreaPixels && imageUrl) {
                const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
                const fd = new FormData();

                const uniqueSuffix = Date.now();
                fd.append("file", croppedBlob, `avatar_${uniqueSuffix}.jpg`);
                fd.append("user_id", userId);

                await axios.post(`${API_BASE}/profile/avatar`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            onSaved();
            onClose();
        } catch (err) {
            console.error("Błąd zapisu profilu:", err);
            alert("Nie udało się zapisać profilu.");
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === overlayRef.current) onClose();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
        >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 relative">
                <h2 className="text-xl font-bold mb-4 text-center">Edytuj profil</h2>

                {/* Avatar + przycinanie */}
                {imageUrl ? (
                    <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <Cropper
                            image={imageUrl}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            showGrid={false}
                            cropShape="round"
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <div className="w-28 h-28 rounded-full overflow-hidden shadow border dark:border-gray-600">
                            <img
                                src={initial.avatar_url || "/placeholder-avatar.png"}
                                alt="Avatar"
                                className="object-cover w-full h-full"
                            />
                        </div>
                    </div>
                )}

                {imageUrl && (
                    <div className="my-2">
                        <label className="block text-sm mb-1">Zoom:</label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>
                )}

                <div className="mb-4">
                    <label className="block w-full">
                        <div className="w-full">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer w-full block text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                            >
                                📷 Wybierz nowe zdjęcie
                            </label>
                        </div>
                    </label>
                </div>

                {/* Formularz */}
                <div className="space-y-3 mb-4">
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

                <div className="grid grid-cols-2 gap-2 mt-6">
                    <button
                        onClick={onClose}
                        className="w-full py-2 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                        ✖ Anuluj
                    </button>
                    <button
                        onClick={handleSave}
                        className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    >
                        💾 Zapisz
                    </button>
                </div>

            </div>
        </div>
    );
};

export default EditProfileModal;