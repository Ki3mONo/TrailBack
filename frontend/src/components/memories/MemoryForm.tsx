import { useMemoryForm } from "../../hooks/memory/useMemoryForm.ts";

interface MemoryFormProps {
    position: [number, number] | null;
    setPosition: (pos: [number, number] | null) => void;
}

export default function MemoryForm({ position, setPosition }: MemoryFormProps) {
    const {
        title,
        setTitle,
        desc,
        setDesc,
        files,
        setFiles,
        date,
        setDate,
        isSubmitting,
        handleSubmit,
        isDragging,
        setIsDragging,
        handleDrop,
        selectedImage,
        setSelectedImage,
        titleRef,
    } = useMemoryForm(position, setPosition);

    return (
        <div
            className={`w-full max-w-md bg-[var(--card)] p-4 rounded-xl shadow-lg flex flex-col space-y-2 transition ${
                isDragging ? "ring-4 ring-blue-400 ring-inset" : ""
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            <h3 className="text-lg font-semibold">Dodaj wspomnienie</h3>

            <input
                ref={titleRef}
                type="text"
                placeholder="Tytuł"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <input
                type="date"
                className="input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
            />

            <textarea
                placeholder="Opis"
                className="input min-h-[80px]"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
            />

            <div className="flex flex-col space-y-2">
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition"
                >
                    Dodaj lub upuść zdjęcia
                </label>
                <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) =>
                        setFiles((prev) => [...prev, ...(Array.from(e.target.files || []))])
                    }
                    className="hidden"
                />

                {/* Podgląd wybranego zdjęcia */}
                {selectedImage && (
                    <div className="mb-4 relative rounded-xl overflow-hidden shadow-lg">
                        <img
                            src={selectedImage}
                            alt="Podgląd"
                            className="w-full max-h-[400px] object-contain bg-black"
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded hover:bg-black/90 transition"
                        >
                            Zamknij podgląd
                        </button>
                    </div>
                )}

                {files.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                        {files.map((file, index) => {
                            const objectUrl = URL.createObjectURL(file);
                            return (
                                <div key={index} className="relative group">
                                    <img
                                        src={objectUrl}
                                        alt={`preview-${index}`}
                                        className="w-full aspect-[4/3] object-cover rounded shadow cursor-pointer"
                                        onClick={() => setSelectedImage(objectUrl)}
                                        title="Kliknij, aby powiększyć"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFiles(files.filter((_, i) => i !== index));
                                        }}
                                        className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                                        title="Usuń"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <input
                type="text"
                className="input"
                placeholder="Lokalizacja wskaźnika"
                value={position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : ""}
                readOnly
            />

            <button
                onClick={handleSubmit}
                className="btn-secondary mt-auto disabled:opacity-50"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Zapisywanie..." : "Zapisz wspomnienie"}
            </button>
        </div>
    );
}
