import { useEffect } from 'react';

// `dvh` is the primary sizing mechanism. Firefox Android can, however, keep
// it smaller than the currently visible page while its browser chrome changes.
// Feed the visible viewport's bottom edge into the stage only in browsers that
// expose VisualViewport; CSS retains the `dvh` fallback everywhere else.
export function usePortfolioViewportSize() {
    useEffect(() => {
        const viewport = window.visualViewport;
        if (!viewport) return undefined;

        let frameId = 0;
        const updateSize = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                // Round outwards so a fractional CSS pixel can never expose a
                // hairline gap below the stage on high-density displays.
                const visibleBlockSize = Math.ceil(viewport.height + viewport.offsetTop);
                document.documentElement.style.setProperty(
                    '--portfolio-viewport-height',
                    `${visibleBlockSize}px`,
                );
            });
        };

        updateSize();
        viewport.addEventListener('resize', updateSize);
        viewport.addEventListener('scroll', updateSize);
        window.addEventListener('resize', updateSize);

        return () => {
            cancelAnimationFrame(frameId);
            viewport.removeEventListener('resize', updateSize);
            viewport.removeEventListener('scroll', updateSize);
            window.removeEventListener('resize', updateSize);
            document.documentElement.style.removeProperty('--portfolio-viewport-height');
        };
    }, []);
}
