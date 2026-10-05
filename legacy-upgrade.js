// Imported only by the service worker. Recover the pre-WebP app, whose cached
// bootstrap cannot display our update prompt or handle removed asset URLs.
// Current builds keep their normal visitor-controlled update lifecycle.
const upgradeScope = new URL(self.registration.scope);
const upgradeCache = `dinoweb-legacy-upgrade-${upgradeScope.href}`;
const upgradeKey = new URL('__legacy_upgrade_state', upgradeScope).href;

async function removeUpgradeState() {
    if (await caches.has(upgradeCache)) await caches.delete(upgradeCache);
}

async function hasLegacyShell() {
    const names = await caches.keys();
    for (const name of names) {
        if (!name.startsWith('workbox-precache-') || !name.endsWith(upgradeScope.href)) continue;
        const cache = await caches.open(name);
        for (const request of await cache.keys()) {
            const url = new URL(request.url);
            if (url.origin !== upgradeScope.origin ||
                ![upgradeScope.pathname, `${upgradeScope.pathname}index.html`].includes(url.pathname)) continue;
            const response = await cache.match(request);
            if (!response?.ok) continue;
            const html = await response.text();
            if (/<div\b[^>]*\bid=["']root["']/.test(html) &&
                /\/assets\/index-[\w-]+\.js/.test(html) &&
                !html.includes('portfolio-boot-shell')) return true;
        }
    }
    return false;
}

// Inspect the previous shell before this worker's precache install starts.
const previousShell = self.registration.active ? hasLegacyShell().catch(() => false) : Promise.resolve(false);

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        await removeUpgradeState();
        if (!await previousShell) return;
        const cache = await caches.open(upgradeCache);
        await cache.put(upgradeKey, new Response('legacy'));
        // Activation still waits for every install promise, including Workbox's
        // complete precache. A failed/offline install leaves the old worker up.
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        if (!await caches.has(upgradeCache)) return;
        const cache = await caches.open(upgradeCache);
        if (!await cache.match(upgradeKey)) return;
        // Consume the one-time flag before any navigation; preserve all theme
        // storage and unrelated applications' caches/registrations.
        await removeUpgradeState();
        await self.clients.claim();
        const windows = await self.clients.matchAll({ type: 'window' });
        for (const client of windows) {
            const url = new URL(client.url);
            if (url.origin !== upgradeScope.origin || !url.pathname.startsWith(upgradeScope.pathname)) continue;
            // Do not await a navigation inside activate: its fetch must be free
            // to start after activation finishes. Older pages need no listener.
            void client.navigate(client.url).catch(() => {});
        }
    })());
});
