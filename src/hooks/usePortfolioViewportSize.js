import { useLayoutEffect } from 'react';

// Firefox Android can report a stale, smaller VisualViewport while browser
// chrome expands/collapses. Never shrink the stage below the window in that
// case. Pinch zoom must not resize/reframe the underlying portfolio.
export function usePortfolioViewportSize() {
    useLayoutEffect(() => {
        const viewport = window.visualViewport;

        let frameId = 0;
        const measure = () => {
            if (viewport && Math.abs(viewport.scale - 1) > 0.01) return;
            const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
            // Round outwards so a fractional CSS pixel can never expose a
            // hairline gap below the stage on high-density displays.
            const visibleBlockSize = Math.ceil(editing && viewport
                ? viewport.height
                : Math.max(window.innerHeight, viewport?.height || 0));
            document.documentElement.style.setProperty(
                '--portfolio-viewport-height',
                `${visibleBlockSize}px`,
            );
        };
        const updateSize = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(measure);
        };

        measure();
        viewport?.addEventListener('resize', updateSize);
        viewport?.addEventListener('scroll', updateSize);
        window.addEventListener('resize', updateSize);
        window.addEventListener('orientationchange', updateSize);

        return () => {
            cancelAnimationFrame(frameId);
            viewport?.removeEventListener('resize', updateSize);
            viewport?.removeEventListener('scroll', updateSize);
            window.removeEventListener('resize', updateSize);
            window.removeEventListener('orientationchange', updateSize);
            document.documentElement.style.removeProperty('--portfolio-viewport-height');
        };
    }, []);
}
