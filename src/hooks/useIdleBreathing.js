import { useEffect } from 'react';

// Scale the already-rendered canvas on the compositor. The actual cube keeps
// its ray-pickable geometry and does not need an endless WebGL render loop.
export function useIdleBreathing(ref, enabled, reducedMotion) {
    useEffect(() => {
        const element = ref.current;
        if (!element) return;
        if (reducedMotion) {
            element.style.transform = 'none';
            return;
        }
        let breathing;
        const settle = element.animate([
            { transform: element.style.transform || 'scale(1)' },
            { transform: 'scale(1)' },
        ], { duration: 180, fill: 'forwards' });
        settle.onfinish = () => {
            if (!enabled) return;
            const frames = Array.from({ length: 41 }, (_, index) => ({
                transform: `scale(${1 + 0.012 * Math.sin(index / 40 * 2 * Math.PI)})`,
                offset: index / 40,
            }));
            breathing = element.animate(frames, { duration: 5000, iterations: Infinity, easing: 'linear' });
        };
        return () => {
            element.style.transform = getComputedStyle(element).transform;
            settle.onfinish = null;
            settle.cancel();
            breathing?.cancel();
        };
    }, [ref, enabled, reducedMotion]);
}
