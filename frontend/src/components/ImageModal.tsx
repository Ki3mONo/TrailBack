import { useEffect, useState } from "react";

type Props = {
    url: string;
    onClose: () => void;
    allImages?: string[]; // Lista wszystkich zdjęć
};

export default function ImageModal({ url, onClose, allImages = [] }: Props) {
    const [current, setCurrent] = useState(url);

    useEffect(() => {
        setCurrent(url);
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [url]);

    const currentIndex = allImages.findIndex((u) => u === current);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allImages.length - 1;

    const showPrev = () => hasPrev && setCurrent(allImages[currentIndex - 1]);
    const showNext = () => hasNext && setCurrent(allImages[currentIndex + 1]);

    const handleKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") showPrev();
        if (e.key === "ArrowRight") showNext();
        if (e.key === "Escape") onClose();
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    });

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div className="relative max-w-5xl w-full max-h-full" onClick={(e) => e.stopPropagation()}>
                {/* Obraz */}
                <img
                    src={current}
                    alt="Podgląd zdjęcia"
                    className="rounded max-h-[90vh] w-auto mx-auto shadow-lg transition duration-300"
                />

                {/* Zamknij */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full"
                    aria-label="Zamknij"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Pobierz */}
                <a
                    href={current}
                    download
                    className="absolute bottom-4 right-4 text-white bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Pobierz zdjęcie
                </a>

                {/* Strzałki */}
                {hasPrev && (
                    <button
                        onClick={showPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full"
                        aria-label="Poprzednie zdjęcie"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {hasNext && (
                    <button
                        onClick={showNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-2 rounded-full"
                        aria-label="Następne zdjęcie"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
