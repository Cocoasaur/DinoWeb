import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function ImageCarousel({ images, imageCount, className = '' }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [translateX, setTranslateX] = useState(0);
    const containerRef = useRef(null);
    const trackRef = useRef(null);

    const totalImages = imageCount || images?.length || 0;
    const maxIndex = Math.max(0, totalImages - 1);

    const goTo = useCallback((index) => {
        setCurrentIndex(Math.min(Math.max(index, 0), maxIndex));
    }, [maxIndex]);

    const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);
    const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft') prev();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [next, prev]);

    // Drag handlers
    const handlePointerDown = (e) => {
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
        const threshold = 50;
        if (diff < -threshold && currentIndex < maxIndex) next();
        else if (diff > threshold && currentIndex > 0) prev();
        setTranslateX(0);
    };

    const slideWidth = 100; // percentage

    return (
        <div className={`relative select-none ${className}`} ref={containerRef}>
            {/* Main viewport */}
            <div
                className="relative overflow-hidden border"
                style={{ borderColor: 'var(--void-border)' }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Track */}
                <div
                    ref={trackRef}
                    className="flex transition-transform duration-500 ease-out"
                    style={{
                        transform: `translateX(calc(-${currentIndex * slideWidth}% + ${isDragging ? translateX : 0}px))`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                >
                    {images?.map((src, idx) => (
                        <div
                            key={idx}
                            className="w-full flex-shrink-0"
                            style={{ flex: `0 0 ${slideWidth}%` }}
                        >
                            <img
                                src={src}
                                alt={`Slide ${idx + 1}`}
                                className="w-full h-auto object-contain"
                                draggable={false}
                                style={{ maxHeight: '400px', width: '100%' }}
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
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center border transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="flex items-center justify-center gap-2 mt-4">
                {images?.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goTo(i)}
                        style={{
                            width: i === currentIndex ? '50px' : '17px',
                            height: '17px',
                            borderRadius: '13px',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            backgroundColor: i === currentIndex
                                ? 'var(--void-text-full)'
                                : 'var(--void-border)',
                            transition: 'all 0.35s cubic-bezier(0.34, 1.36, 0.64, 1)',
                            flexShrink: 0,
                        }}
                    />
                ))}
            </div>

            {/* Counter */}
            {totalImages > 1 && (
                <div
                    className="absolute top-3 right-3 px-2 py-1 text-[10px] tracking-widest uppercase border"
                    style={{
                        fontFamily: "'Space Grotesk', monospace",
                        backgroundColor: 'var(--void-surface-80)',
                        borderColor: 'var(--void-border)',
                        color: 'var(--void-text-muted)',
                    }}
                >
                    {String(currentIndex + 1).padStart(2, '0')} / {String(totalImages).padStart(2, '0')}
                </div>
            )}
        </div>
    );
}