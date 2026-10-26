// The asset preloader awaits secondary typography and layout styles. Keep one
// shared import so React StrictMode and later page navigation reuse it.
let pending;

export function loadDeferredStyles() {
    pending ??= import('../styles/deferred.css.js').catch(error => {
        pending = undefined;
        throw error;
    });
    return pending;
}
