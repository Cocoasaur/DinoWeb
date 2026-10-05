// Wall-clock progress keeps navigation duration stable when frames are dropped.
export function transitionProgress(startedAt, now, durationMs) {
    if (durationMs <= 0) return 1;
    return Math.min(1, Math.max(0, (now - startedAt) / durationMs));
}

export function easeInOut(t) {
    // Zero velocity and acceleration at both ends prevent a sharp start/stop.
    return t * t * t * (t * (t * 6 - 15) + 10);
}

export function getCubeTransition(reduceEffects, reducedMotion) {
    return {
        zoomInMs: reducedMotion ? 0 : reduceEffects ? 1200 : 1450,
        blurInMs: reducedMotion ? 0 : reduceEffects ? 180 : 240,
        zoomOutMs: reducedMotion ? 0 : reduceEffects ? 1300 : 1550,
        fadeMs: reducedMotion ? 0 : reduceEffects ? 750 : 900,
        blurPx: reducedMotion ? 0 : reduceEffects ? 12 : 24,
    };
}

export function getCubeStageStyle(isZoomed, isZoomingOut, transition) {
    const covered = isZoomed && !isZoomingOut;
    const duration = isZoomingOut ? transition.zoomOutMs : transition.blurInMs;
    return {
        transform: covered ? 'scale(1.04)' : 'none',
        filter: covered ? `blur(${transition.blurPx}px)` : 'blur(0px)',
        transition: `filter ${duration}ms cubic-bezier(0.65, 0, 0.35, 1), transform ${duration}ms cubic-bezier(0.65, 0, 0.35, 1)`,
    };
}
