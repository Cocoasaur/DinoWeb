import React, { useRef, useState, useCallback } from 'react';

/**
 * TiltCard — 3D perspective tilt effect.
 *
 * Props:
 *  - tiltAmount:  max rotation in degrees (default 12)
 *  - scale:       hover scale multiplier (default 1.02)
 *  - glare:       show dynamic light sweep (default true)
 *  - perspective: CSS perspective in px (default 1000)
 *  - depth:       translateZ offset for inner content in px (default 0).
 *                 Set to 0 so the card tilts as one flat unit.
 */
export default function TiltCard({
    children,
    className = '',
    style = {},
    tiltAmount = 12,
    scale = 1.02,
    glare = true,
    perspective = 1000,
    depth = 0,
}) {
    const cardRef = useRef(null);
    const [transform, setTransform] = useState('');
    const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = useCallback(
        (e) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Invert Y so tilting the mouse up rotates the card top away
            const rotateX = ((y - centerY) / centerY) * -tiltAmount;
            const rotateY = ((x - centerX) / centerX) * tiltAmount;

            setTransform(
                `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`
            );
            setGlarePos({
                x: (x / rect.width) * 100,
                y: (y / rect.height) * 100,
            });
        },
        [tiltAmount, scale, perspective]
    );

    const handleMouseLeave = useCallback(() => {
        setTransform(
            `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`
        );
        setIsHovered(false);
    }, [perspective]);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);

    return (
        <div
            ref={cardRef}
            className={className}
            style={{
                display: 'inline-block',
                verticalAlign: 'top',
                position: 'relative',
                ...style,
                transform:
                    transform || `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`,
                transition: isHovered
                    ? 'transform 0.1s ease-out'
                    : 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
                transformStyle: 'preserve-3d',
                willChange: 'transform',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {/* Inner content — only lift if depth > 0 */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 2,
                    transform: depth ? `translateZ(${depth}px)` : undefined,
                }}
            >
                {children}
            </div>

            {glare && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.28) 0%, transparent 55%)`,
                        opacity: isHovered ? 0.55 : 0,
                        transition: 'opacity 0.35s ease',
                        pointerEvents: 'none',
                        mixBlendMode: 'overlay',
                        zIndex: 3,
                    }}
                />
            )}
        </div>
    );
}