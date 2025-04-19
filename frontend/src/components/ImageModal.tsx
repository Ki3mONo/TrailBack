import { useEffect, useState } from "react";

type Props = {
    url: string;
    onClose: () => void;
    allImages?: string[];
    memoryName: string;
};

export default function ImageModal({ url, onClose, allImages = [], memoryName }: Props) {
    const [current, setCurrent] = useState(url);
    const [isTransitioning, setIsTransitioning] = useState(false);

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

    const changeImage = (newUrl: string) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrent(newUrl);
            setIsTransitioning(false);
        }, 200);
    };

    const showPrev = () => hasPrev && changeImage(allImages[currentIndex - 1]);
    const showNext = () => hasNext && changeImage(allImages[currentIndex + 1]);

    const handleKey = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") showPrev();
        if (e.key === "ArrowRight") showNext();
        if (e.key === "Escape") onClose();
    };

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    });

    const handleDownload = async () => {
        try {
            const response = await fetch(current);
            const blob = await response.blob();
            const urlObject = window.URL.createObjectURL(blob);

            const number = currentIndex + 1;
            const paddedNumber = number.toString().padStart(2, "0");
            const sanitizedName = memoryName.replace(/\s+/g, "_").toLowerCase();
            const fileName = `${sanitizedName}_${paddedNumber}.jpg`;

            const link = document.createElement("a");
            link.href = urlObject;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(urlObject);
        } catch (error) {
            console.error("Błąd pobierania zdjęcia:", error);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black bg-opacity-80 flex flex-col items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Zamknij */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white bg-white bg-opacity-10 hover:bg-opacity-20 p-3 rounded-full"
                aria-label="Zamknij"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Obraz + strzałki */}
            <div className="relative flex items-center justify-center w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
                {hasPrev && (
                    <button
                        onClick={showPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-4 rounded-full border-2 border-white"
                        aria-label="Poprzednie zdjęcie"
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                <img
                    key={current}
                    src={`${current}?width=1000&quality=60`}
                    alt="Podgląd zdjęcia"
                    loading="lazy"
                    className={`rounded max-h-[80vh] w-auto mx-auto shadow-lg transition-opacity duration-300 ${
                        isTransitioning ? "opacity-0 blur-sm" : "opacity-100"
                    }`}
                    onLoad={(e) => e.currentTarget.classList.remove("blur-sm")}
                />


                {hasNext && (
                    <button
                        onClick={showNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white p-4 rounded-full border-2 border-white"
                        aria-label="Następne zdjęcie"
                    >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Numeracja zdjęcia */}
            {allImages.length > 1 && (
                <div className="mt-4 text-white text-sm">{`Zdjęcie ${currentIndex + 1} z ${allImages.length}`}</div>
            )}

            {/* Pobierz w prawym dolnym rogu */}
            <button
                onClick={handleDownload}
                className="absolute bottom-4 right-4 text-white bg-blue-600 px-6 py-3 rounded hover:bg-blue-700 transition"
            >
                Pobierz zdjęcie
            </button>
        </div>
    );
}
