import { useMemoryModal } from "../../hooks/memory/useMemoryModal.ts";
import { MemoryModalProps } from "../../types/types";
import ImageModal from "./ImageModal";
import ShareMemoryModal from "./ShareMemoryModal";
import EditMemoryModal from "./EditMemoryModal";
import MemorySharingInfo from "./MemorySharingInfo";
import PhotoUploadModal from "./PhotoUploadModal";
import ConfirmationModal from "../common/ConfirmationModal";
import { toast } from "react-toastify";

export default function MemoryModal({ memory, isShared, onClose, onDelete, currentUserId }: MemoryModalProps) {
    const {
        photos,
        previewUrl,
        setPreviewUrl,
        shareOpen,
        setShareOpen,
        editOpen,
        setEditOpen,
        photoModalOpen,
        setPhotoModalOpen,
        fetchPhotos,
        deletePhoto,
        deleteMemory,
        confirmDeleteMemory,
        setConfirmDeleteMemory,
        confirmDeletePhotoId,
        setConfirmDeletePhotoId,
    } = useMemoryModal(memory.id, currentUserId);

    return (
        <div className="p-6 space-y-6">
            {/* Modale */}
            {previewUrl && (
                <ImageModal
                    url={previewUrl}
                    onClose={() => setPreviewUrl(null)}
                    allImages={photos.map((p) => p.url)}
                    memoryName={memory.title}
                    onDelete={(url) => {
                        const photo = photos.find((p) => p.url === url);
                        if (photo) setConfirmDeletePhotoId(photo.id);
                        setPreviewUrl(null);
                    }}
                />
            )}

            {shareOpen && (
                <ShareMemoryModal
                    memoryId={memory.id}
                    onClose={() => setShareOpen(false)}
                />
            )}

            {editOpen && (
                <EditMemoryModal
                    memoryId={memory.id}
                    initialTitle={memory.title}
                    initialDescription={memory.description}
                    userId={currentUserId}
                    onClose={() => setEditOpen(false)}
                    onSave={(title, desc) => {
                        memory.title = title;
                        memory.description = desc;
                        toast.success("Wspomnienie zaktualizowane");
                    }}
                />
            )}

            {photoModalOpen && (
                <PhotoUploadModal
                    memoryId={memory.id}
                    userId={currentUserId}
                    onClose={() => setPhotoModalOpen(false)}
                    onUploaded={fetchPhotos}
                />
            )}

            {/* Confirmation modale */}
            {confirmDeletePhotoId && (
                <ConfirmationModal
                    message="Czy na pewno chcesz usunąć to zdjęcie?"
                    onConfirm={async () => {
                        await deletePhoto(confirmDeletePhotoId);
                        setConfirmDeletePhotoId(null);
                    }}
                    onCancel={() => setConfirmDeletePhotoId(null)}
                />
            )}

            {confirmDeleteMemory && (
                <ConfirmationModal
                    message="Czy na pewno chcesz usunąć wspomnienie?"
                    onConfirm={async () => {
                        await deleteMemory(() => {
                            onClose();
                            onDelete();
                        });
                        setConfirmDeleteMemory(false);
                    }}
                    onCancel={() => setConfirmDeleteMemory(false)}
                />
            )}

            {/* Treść */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{memory.title}</h2>
                {isShared && (
                    <span className="bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
                        Udostępnione
                    </span>
                )}
            </div>

            {memory.description && (
                <p className="text-gray-700 dark:text-gray-200">{memory.description}</p>
            )}

            {/* Zdjęcia */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="md:col-span-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-1">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative aspect-[4/3] overflow-hidden rounded shadow-md cursor-zoom-in group"
                                onClick={() => setPreviewUrl(photo.url)}
                            >
                                <img
                                    src={`${photo.url}?width=300&quality=30`}
                                    alt="Zdjęcie"
                                    className="w-full h-full object-cover blur-sm opacity-0 transition duration-500"
                                    onLoad={(e) => e.currentTarget.classList.remove("blur-sm", "opacity-0")}
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setConfirmDeletePhotoId(photo.id);
                                    }}
                                    className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                                >
                                    Usuń
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="md:col-span-1 min-w-[180px]">
                    <MemorySharingInfo memoryId={memory.id} ownerId={memory.created_by} />
                </div>
            </div>

            {/* Akcje */}
            <div className="flex justify-between items-center mt-4">
                <button className="btn-outline" onClick={onClose}>
                    Powrót
                </button>

                <div className="flex items-center gap-2">
                    <button onClick={() => setPhotoModalOpen(true)} className="btn-outline">
                        Dodaj zdjęcia
                    </button>

                    <button
                        onClick={() => {
                            if (isShared) {
                                toast.error("Nie masz uprawnień do edycji wspomnienia.");
                                return;
                            }
                            setEditOpen(true);
                        }}
                        className="btn-outline"
                    >
                        Edytuj wspomnienie
                    </button>

                    <button onClick={() => setShareOpen(true)} className="btn-outline">
                        Udostępnij
                    </button>

                    <button
                        onClick={() => setConfirmDeleteMemory(true)}
                        className="btn bg-red-600 text-white"
                    >
                        Usuń
                    </button>
                </div>
            </div>
        </div>
    );
}
