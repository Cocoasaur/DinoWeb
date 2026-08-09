import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function ImageCarousel({ images, imageCount, className = '', onImageClick, keyboardDisabled = false }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const containerRef = useRef(null);
    const trackRef = useRef(null);
    const pointerDownSlideRef = useRef(null);

    const totalImages = imageCount || images?.length || 0;
    const maxIndex = Math.max(0, totalImages - 1);

    const goTo = useCallback((index) => {
        setCurrentIndex(Math.min(Math.max(index, 0), maxIndex));
    }, [maxIndex]);

    const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
    const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

    // Keyboard navigation
    useEffect(() => {
        if (keyboardDisabled) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [next, prev, keyboardDisabled]);

    // Pointer handlers live on the wrapper (containerRef) because
    // setPointerCapture retargets all subsequent pointer events to the
    // capture element — the viewport child never receives them.
    const handlePointerDown = (e) => {
        pointerDownSlideRef.current = e.target.closest?.('.image-carousel__slide') || null;
        setIsDragging(true);
        setStartX(e.clientX);
        setTranslateX(0);
        if (containerRef.current) containerRef.current.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        const diff = e.clientX - startX;
        setTranslateX(diff);
    };

    const handlePointerUp = (e) => {
        if (!isDragging) return;
        setIsDragging(false);
        const diff = e.clientX - startX;
        if (Math.abs(diff) < 5) {
            // Tap — open the lightbox if the press started on a slide
            if (pointerDownSlideRef.current) onImageClick?.(currentIndex);
        } else if (diff < -50 && currentIndex < maxIndex) {
            next();
        } else if (diff > 50 && currentIndex > 0) {
            prev();
        }
        pointerDownSlideRef.current = null;
        setTranslateX(0);
    };

    const slideWidth = 100; // percentage

    return (
        <div
            className={`image-carousel relative select-none ${className}`}
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Main viewport */}
            <div
                className="image-carousel__viewport relative overflow-hidden border"
                style={{ borderColor: 'var(--void-border)' }}
            >
                {/* Track */}
                <div
                    ref={trackRef}
                    className="image-carousel__track"
                    style={{
                        transform: `translateX(calc(-${currentIndex * slideWidth}% + ${isDragging ? translateX : 0}px))`,
                        cursor: isDragging ? 'grabbing' : onImageClick ? 'zoom-in' : 'grab',
                    }}
                >
                    {images?.map((src, idx) => (
                        <div
                            key={idx}
                            className="image-carousel__slide w-full flex-shrink-0"
                            style={{ flex: `0 0 ${slideWidth}%` }}
                        >
                            <img
                                src={src}
                                alt={`Slide ${idx + 1}`}
                                className="image-carousel__image"
                                loading="lazy"
                                decoding="async"
                                draggable={false}
                            />
                        </div>
                    ))}
                </div>

                {/* Navigation arrows — border highlight on hover, no scale */}
                {totalImages > 1 && (
                    <>
                        <button
                            onClick={prev}
                            disabled={currentIndex === 0}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="image-carousel__arrow image-carousel__arrow--prev absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border transition-all duration-200"
                            style={{
                                backgroundColor: 'var(--void-surface-80)',
                                borderColor: 'var(--void-border)',
                                color: 'var(--void-text-full)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
                                e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'var(--void-btn-bg)';
                                e.currentTarget.style.borderColor = 'var(--void-btn-border)';
                            }}
                        >
                            ←
                        </button>
                        <button
                            onClick={next}
                            disabled={currentIndex === maxIndex}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="image-carousel__arrow image-carousel__arrow--next absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border transition-all duration-200"
                            style={{
                                backgroundColor: 'var(--void-surface-80)',
                                borderColor: 'var(--void-border)',
                                color: 'var(--void-text-full)',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.backgroundColor = 'var(--void-surface-80)';
                                e.currentTarget.style.borderColor = 'var(--void-text-dim)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.backgroundColor = 'var(--void-btn-bg)';
                                e.currentTarget.style.borderColor = 'var(--void-btn-border)';
                            }}
                        >
                            →
                        </button>
                    </>
                )}
            </div>

            {/* ── Dot indicators — matching HorizontalCarousel.jsx style ── */}
            <div className="image-carousel__dots">
                {images?.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        onPointerDown={(e) => e.stopPropagation()}
                        className={`image-carousel__dot ${i === currentIndex ? 'image-carousel__dot--active' : ''}`}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {/* Counter */}
            {totalImages > 1 && (
                <div
                    className="image-carousel__counter absolute top-3 right-3 px-2 py-1 text-[10px] tracking-widest uppercase border"
                    style={{
                        fontFamily: "'Space Grotesk', monospace",
                        backgroundColor: 'var(--void-surface-80)',
                        borderColor: 'var(--void-border)',
                        color: 'var(--void-text-muted)',
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {String(currentIndex + 1).padStart(2, '0')} / {String(totalImages).padStart(2, '0')}
                </div>
            )}
        </div>
    );
}
