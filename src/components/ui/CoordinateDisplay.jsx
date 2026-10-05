import { useRef, useEffect } from 'react';

export default function CoordinateDisplay({ coordsRef, paused }) {
    const spanRef = useRef(null);
    const lastTextRef = useRef('');

    useEffect(() => {
        if (paused) return;
        const tick = () => {
            if (document.visibilityState !== 'hidden') {
                if (spanRef.current && coordsRef.current) {
                    const { x, y, z } = coordsRef.current;
                    const w = window.innerWidth;

                    let text;
                    if (w < 400) {
                        text = `X:${x.toFixed(1)} Y:${y.toFixed(1)} Z:${z.toFixed(1)}`;
                    } else {
                        text = `[ X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}, Z: ${z.toFixed(2)} ]`;
                    }

                    if (lastTextRef.current !== text) {
                        lastTextRef.current = text;
                        spanRef.current.textContent = text;
                    }
                }
            }
        };
        tick();
        const timer = setInterval(tick, 100);
        return () => clearInterval(timer);
    }, [coordsRef, paused]);

    return (
        <div className="home-coordinate coord-entrance">
            <span ref={spanRef} className="home-coordinate__value" />
        </div>
    );
}
