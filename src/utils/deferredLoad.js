/* ══════════════════════════════════════════════════════
   DEFERRED LOADING
   Loads non-critical fonts and CSS off the critical render
   path (after first paint via requestIdleCallback). Vite
   emits them as one lazy stylesheet, reducing request and style-recalc
   overhead while keeping them outside the FCP/LCP path.
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

    schedule(() => import('../styles/deferred.css.js'));
}
