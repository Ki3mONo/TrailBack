import { useRef } from "react";
import { useImageModal } from "../../hooks/memory/useImageModal.ts";
import { ImageModalProps } from "../../types/types";

export default function ImageModal({
                                       url,
                                       onClose,
                                       allImages = [],
                                       memoryName,
                                       onDelete,
                                   }: ImageModalProps) {
    const {
        current,
        isTransitioning,
        currentIndex,
        hasPrev,
        hasNext,
        showPrev,
        showNext,
        handleSwipe,
    } = useImageModal(url, allImages, onClose);

    const touchStartX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current !== null) {
            const touchEndX = e.changedTouches[0].clientX;
            handleSwipe(touchStartX.current, touchEndX);
            touchStartX.current = null;
        }
    };

    const handleDownload = async () => {
        const response = await fetch(current);
        const blob = await response.blob();
        const urlObject = window.URL.createObjectURL(blob);
        const name = memoryName.replace(/\s+/g, "_").toLowerCase();
        const filename = `${name}_${currentIndex + 1}.jpg`;

        const link = document.createElement("a");
        link.href = urlObject;
        link.download = filename;
        link.click();
        link.remove();
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center"
            onClick={onClose}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Zamknij */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white rounded-full w-14 h-14 flex items-center justify-center transition"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Strzałki */}
            {hasPrev && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        showPrev();
                    }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-14 h-14 flex items-center justify-center transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {hasNext && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        showNext();
                    }}
                    className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-14 h-14 flex items-center justify-center transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Obraz */}
            <div className="relative max-w-4xl w-full px-4" onClick={(e) => e.stopPropagation()}>
                <img
                    src={current}
                    className={`rounded max-h-[80vh] w-auto mx-auto shadow-lg transition-opacity duration-300 ${
                        isTransitioning ? "opacity-0" : "opacity-100"
                    }`}
                />
            </div>

            {/* Akcje */}
            <div className="mt-4 flex gap-4">
                <button onClick={handleDownload} className="btn bg-blue-600 text-white">
                    Pobierz
                </button>
                {onDelete && (
                    <button
                        onClick={() => onDelete(current)}
                        className="btn bg-red-600 text-white"
                    >
                        Usuń
                    </button>
                )}
            </div>
        </div>
    );
}
