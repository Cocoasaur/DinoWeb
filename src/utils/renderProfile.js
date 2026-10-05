export function getRenderProfile() {
    // Missing RAM information (for example in Firefox) is not a low-end signal.
    const reportedMemory = navigator.deviceMemory;
    const memory = Number.isFinite(reportedMemory) && reportedMemory > 0 ? reportedMemory : null;
    const cores = navigator.hardwareConcurrency || 4;
    const connection = navigator.connection;
    const tier = connection?.saveData || (memory !== null && memory <= 2) || cores <= 2 || connection?.effectiveType === '2g'
        ? 'low'
        : (memory !== null && memory <= 4) || cores <= 4 || connection?.effectiveType === '3g' ? 'medium' : 'high';
    const isMobile = window.matchMedia('(max-width: 767px), (hover: none) and (pointer: coarse)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxDpr = tier === 'low' ? 1 : tier === 'medium' ? 1.25 : isMobile ? 1.5 : 1.75;
    return {
        tier,
        isMobile,
        dpr: [1, Math.min(window.devicePixelRatio || 1, maxDpr)],
        labelScale: tier === 'low' ? .5 : tier === 'medium' || isMobile || reducedMotion ? 1 : 2,
    };
}
