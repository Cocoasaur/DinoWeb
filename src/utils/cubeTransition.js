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
    const zoomInMs = reducedMotion ? 0 : reduceEffects ? 1200 : 1450;
    return {
        zoomInMs,
        blurInMs: zoomInMs,
        zoomOutMs: reducedMotion ? 0 : reduceEffects ? 1300 : 1550,
        fadeMs: reducedMotion ? 0 : reduceEffects ? 750 : 900,
        blurPx: reducedMotion ? 0 : reduceEffects ? 12 : 24,
    };
}

export function getCubeStageStyle(isZoomed, isZoomingOut, transition, overlayPhase) {
    const covered = isZoomed && !isZoomingOut;
    const held = covered && ['fading-in', 'open', 'fading-out'].includes(overlayPhase);
    const duration = isZoomingOut ? transition.zoomOutMs : transition.blurInMs;
    return {
        transform: covered ? 'scale(1.04)' : 'none',
        filter: covered ? `blur(${transition.blurPx}px)` : 'blur(0px)',
        transition: held ? 'none' : `filter ${duration}ms cubic-bezier(0.65, 0, 0.35, 1), transform ${duration}ms cubic-bezier(0.65, 0, 0.35, 1)`,
    };
}
