import { useEffect } from 'react';

// Tracks the gap (px) between the bottom of the layout viewport and the
// bottom of the visual viewport. On mobile browsers whose chrome (URL bar)
// overlays the page (Firefox Android, iOS Safari), `position: fixed`
// resolves against the layout viewport, so bottom-anchored UI ends up
// hidden behind the browser chrome. The gap is exposed as --vv-bottom-gap
// on <html> so bottom calc()s can add it. It is 0 on desktop, in
// fullscreen, and whenever the visible viewport matches the layout
// viewport, so those cases are visually unchanged.
export function useVisualViewportGap() {
    useEffect(() => {
        let rafId = 0;
        const updateGap = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const vv = window.visualViewport;
                const gap = vv
                    ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
                    : 0;
                document.documentElement.style.setProperty('--vv-bottom-gap', `${gap}px`);
            });
        };

        updateGap();
        window.addEventListener('resize', updateGap);
        window.visualViewport?.addEventListener('resize', updateGap);
        window.visualViewport?.addEventListener('scroll', updateGap);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', updateGap);
            window.visualViewport?.removeEventListener('resize', updateGap);
            window.visualViewport?.removeEventListener('scroll', updateGap);
        };
    }, []);
}