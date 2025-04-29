import { usePhotoUploadModal } from "../../hooks/memory/usePhotoUploadModal.ts";

interface Props {
    memoryId: string;
    userId: string;
    onClose: () => void;
    onUploaded?: () => void;
}

export default function PhotoUploadModal({ memoryId, userId, onClose, onUploaded }: Props) {
    const {
        files,
        setFiles,
        isUploading,
        isDragging,
        setIsDragging,
        handleUpload,
        handleDrop,
    } = usePhotoUploadModal(memoryId, userId, onClose, onUploaded);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => setIsDragging(true)}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`bg-white dark:bg-[#2a2a2d] w-full max-w-xl p-6 rounded-xl shadow-lg space-y-4 transition ${
                    isDragging ? "ring-4 ring-blue-400 ring-inset" : ""
                }`}
            >
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Dodaj zdjęcia</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white transition"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <label className="btn bg-blue-600 text-white hover:bg-green-700 w-full text-center cursor-pointer justify-center">
                    Wybierz z urządzenia lub przeciągnij
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            const selectedFiles = e.target.files;
                            if (selectedFiles && selectedFiles.length > 0) {
                                setFiles(prev => [...prev, ...Array.from(selectedFiles)]);
                            }
                        }}
                    />
                </label>

                {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                        {files.map((file, idx) => {
                            const url = URL.createObjectURL(file);
                            return (
                                <div
                                    key={idx}
                                    className="relative group aspect-[4/3] rounded shadow overflow-hidden cursor-pointer"
                                >
                                    <img src={url} alt={file.name} className="w-full h-full object-cover" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFiles(prev => prev.filter((_, i) => i !== idx));
                                        }}
                                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        onClick={handleUpload}
                        className="btn-secondary disabled:opacity-50"
                        disabled={isUploading || files.length === 0}
                    >
                        {isUploading ? "Przesyłanie..." : "Dodaj wszystkie zdjęcia"}
                    </button>
                </div>
            </div>
        </div>
    );
}
