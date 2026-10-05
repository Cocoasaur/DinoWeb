// Kept in the small entry chunk so recovery works even if React cannot load.
const RETRY_KEY = 'dinoweb-chunk-recovery';
const RETRY_WINDOW_MS = 120000;
const RETRY_PARAM = '__dinoweb_retry';
let recovering = false;

export function isImportFailure(error) {
    return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|Failed to load module script/i.test(String(error?.message || error));
}

function claimRetry() {
    try {
        const previous = Number(sessionStorage.getItem(RETRY_KEY));
        if (previous && Date.now() - previous < RETRY_WINDOW_MS) return false;
        sessionStorage.setItem(RETRY_KEY, String(Date.now()));
        return true;
    } catch {
        // Storage may be disabled. A URL marker still prevents a reload loop.
        return !new URL(location.href).searchParams.has(RETRY_PARAM);
    }
}

function showNotice(message, canRetry) {
    document.getElementById('portfolio-load-notice')?.remove();
    const panel = document.createElement('div');
    panel.id = 'portfolio-load-notice';
    panel.setAttribute('role', canRetry ? 'alert' : 'status');
    panel.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;gap:20px;padding:32px;text-align:center;font:16px/1.6 system-ui,sans-serif;background:var(--void-bg,#e8e7e2);color:var(--void-text-full,#111)';
    const text = document.createElement('p');
    text.textContent = message;
    panel.append(text);
    if (canRetry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Reload portfolio';
        button.style.cssText = 'justify-self:center;padding:12px 20px;border:1px solid currentColor;background:transparent;color:inherit;font:inherit;cursor:pointer';
        button.onclick = () => {
            try { sessionStorage.removeItem(RETRY_KEY); } catch { /* Optional storage. */ }
            void reloadFreshPortfolio();
        };
        panel.append(button);
    }
    document.body.append(panel);
    if (canRetry) panel.querySelector('button').focus();
}

async function reloadFreshPortfolio() {
    showNotice('Loading the latest portfolio…', false);
    // A stale worker can otherwise serve the same old HTML after a reload.
    // Release only this app's registration on failure; leave caches, themes
    // and other applications' workers alone. Normal startup reinstalls it.
    const releaseWorker = async () => {
        const base = new URL(import.meta.env.BASE_URL, location.origin);
        const registration = await navigator.serviceWorker?.getRegistration(base.href);
        if (registration?.scope === base.href) await registration.unregister();
    };
    await Promise.race([
        releaseWorker().catch(() => {}),
        new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
    const target = new URL(location.href);
    target.searchParams.set(RETRY_PARAM, String(Date.now()));
    location.replace(target.href);
}

export function recoverImportFailure(error) {
    if (!isImportFailure(error)) return false;
    if (recovering) return true;
    recovering = true;
    if (navigator.onLine && claimRetry()) {
        void reloadFreshPortfolio();
    } else {
        showNotice('This page could not load. Check your connection, then reload the portfolio.', true);
    }
    return true;
}

export function handleAppLoadFailure(error) {
    if (!recoverImportFailure(error) && !recovering) {
        showNotice('The portfolio could not open this page. Please reload to try again.', true);
    }
}

export function installLoadRecovery() {
    window.addEventListener('vite:preloadError', event => {
        // Keep the rejection intact for React's error boundary and import
        // catches; swallowing it would turn a failed module into undefined.
        recoverImportFailure(event.payload);
    });
    // Remove the fallback loop marker without clearing the session guard.
    try {
        const url = new URL(location.href);
        if (url.searchParams.has(RETRY_PARAM) && sessionStorage.getItem(RETRY_KEY)) {
            url.searchParams.delete(RETRY_PARAM);
            history.replaceState(history.state, '', url.href);
        }
    } catch { /* Preserve the URL guard when storage is unavailable. */ }
}
