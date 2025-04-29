import { useState, useEffect, useCallback } from "react";

export function useImageModal(
    url: string,
    allImages: string[],
    onClose: () => void
) {
    const [current, setCurrent] = useState(url);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const currentIndex = allImages.findIndex((u) => u === current);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allImages.length - 1;

    useEffect(() => {
        setCurrent(url);
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [url]);

    const changeImage = (newUrl: string) => {
        if (isTransitioning) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrent(newUrl);
            setIsTransitioning(false);
        }, 200);
    };

    const showPrev = () => hasPrev && changeImage(allImages[currentIndex - 1]);
    const showNext = () => hasNext && changeImage(allImages[currentIndex + 1]);

    const handleKey = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "ArrowLeft") showPrev();
            if (e.key === "ArrowRight") showNext();
            if (e.key === "Escape") onClose();
        },
        [currentIndex, onClose]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [handleKey]);

    const handleSwipe = useCallback((startX: number, endX: number) => {
        const diff = startX - endX;
        if (Math.abs(diff) > 50) { // minimalny dystans, aby swipe był zaliczony
            if (diff > 0) {
                showNext();
            } else {
                showPrev();
            }
        }
    }, [currentIndex]);

    return {
        current,
        isTransitioning,
        currentIndex,
        hasPrev,
        hasNext,
        showPrev,
        showNext,
        handleSwipe,
        setCurrent,
    };
}
