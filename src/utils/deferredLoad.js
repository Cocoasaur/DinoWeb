/* ══════════════════════════════════════════════════════
   DEFERRED LOADING
   Loads non-critical fonts and CSS off the critical render
   path (after first paint via requestIdleCallback). Vite
   emits each dynamically-imported CSS as its own lazy chunk,
   so nothing here blocks FCP/LCP.
   ══════════════════════════════════════════════════════ */

let started = false;

function schedule(fn) {
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(fn, { timeout: 5000 });
    } else {
        window.setTimeout(fn, 300);
    }
}

// Keep-alive guard so early unmounts don't cancel the warm-up.
export function loadDeferredStyles() {
    if (started) return;
    started = true;

    schedule(() => {
        // Secondary fonts — body + sub-headings (hero keeps Space Grotesk 700 critical)
        import('@fontsource/space-grotesk/latin-400.css');
        import('@fontsource/inter/latin-400.css');
        import('@fontsource/inter/latin-500.css');
        import('@fontsource/inter/latin-700.css');

        // Animation + below-fold styles — not needed for the hero LCP paint
        import('../styles/entrance-animations.css');
        import('../styles/about-layout.css');
        import('../styles/projects-layout.css');
        import('../styles/scrollbar.css');
    });
}
