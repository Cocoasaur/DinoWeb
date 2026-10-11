import { useLayoutEffect } from 'react';
import { getHomeComposition } from './useHomeViewportLayout';

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
            const root = document.documentElement;
            const width = document.querySelector('.portfolio-viewport')?.clientWidth || window.innerWidth;
            const composition = getHomeComposition(width, visibleBlockSize);
            const properties = {
                '--portfolio-viewport-height': `${visibleBlockSize}px`,
                '--home-content-inset': `${composition.inset}px`,
                '--home-marker-inset': `${composition.markerInset}px`,
                '--home-meta-font-size': `${composition.metaFontSize}px`,
                '--home-brand-scale': String(composition.brandScale),
                '--home-brand-top': `${composition.brandTop}px`,
                '--home-sidebar-width': `${composition.sidebarWidth}px`,
                '--home-sidebar-font-size': `${composition.sidebarFontSize}px`,
            };
            for (const [name, value] of Object.entries(properties)) {
                if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value);
            }
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
            for (const name of ['--portfolio-viewport-height', '--home-content-inset', '--home-marker-inset',
                '--home-meta-font-size', '--home-brand-scale', '--home-brand-top', '--home-sidebar-width',
                '--home-sidebar-font-size']) document.documentElement.style.removeProperty(name);
        };
    }, []);
}
