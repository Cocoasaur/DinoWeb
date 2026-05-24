import { useRef, useEffect } from 'react';

export default function CoordinateDisplay({ coordsRef }) {
    const spanRef = useRef(null);

    useEffect(() => {
        let frameId;

        const tick = () => {
            if (spanRef.current && coordsRef.current) {
                const { x, y, z } = coordsRef.current;
                spanRef.current.textContent =
                    `[ X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)} ]`;
            }
            frameId = requestAnimationFrame(tick);
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [coordsRef]);

    return (
        <div className="fixed top-10 left-12 z-40 hidden md:block coord-entrance">
            <span
                ref={spanRef}
                className="font-mono text-xs tracking-widest"
                style={{ fontFamily: "'Space Grotesk', monospace", color: 'var(--void-text-muted)' }}
            />
        </div>
    );
}