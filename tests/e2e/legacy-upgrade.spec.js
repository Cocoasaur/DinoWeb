import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'

const currentShell = readFileSync(new URL('../../dist/index.html', import.meta.url), 'utf8')
const oldShell = '<!doctype html><html><body><div id="root">Old cached portfolio</div><script type="module" src="/DinoWeb/assets/index-legacy-test.js"></script></body></html>'

function fixtureWorker(html) {
  return `
    self.addEventListener('install', event => event.waitUntil((async () => {
      const cache = await caches.open('workbox-precache-v2-' + self.registration.scope);
      await cache.put(new URL('index.html?__WB_REVISION__=old', self.registration.scope),
        new Response(${JSON.stringify(html)}, {headers: {'Content-Type': 'text/html'}}));
      await self.skipWaiting();
    })()));
    self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
    self.addEventListener('fetch', event => {
      if (event.request.mode === 'navigate') event.respondWith(
        caches.open('workbox-precache-v2-' + self.registration.scope).then(cache =>
          cache.match(new URL('index.html?__WB_REVISION__=old', self.registration.scope))));
    });
  `
}

for (const mode of ['legacy', 'modern', 'failed legacy install']) {
  test(`${mode} service-worker update preserves the correct lifecycle`, async ({ page, context, baseURL }) => {
    test.setTimeout(60000)
    const scope = new URL(baseURL)
    const workerURL = new URL('sw.js', scope).href
    const oldWorkerURL = new URL('old-fixture-sw.js', scope).href
    const seedURL = new URL('seed.html', scope).href
    await context.route(seedURL, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body>Seed</body></html>' }))
    await context.route(oldWorkerURL, route => route.fulfill({
      contentType: 'application/javascript', body: fixtureWorker(mode === 'modern' ? currentShell : oldShell),
    }))
    await context.route('**/assets/index-legacy-test.js', route => route.fulfill({ status: 404, body: 'Removed legacy module' }))
    await page.goto(seedURL)
    await page.evaluate(async ({ oldWorkerURL, scope }) => {
      localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu')
      const unrelated = await caches.open('unrelated-test-cache')
      await unrelated.put('/other-app/keep', new Response('keep'))
      await navigator.serviceWorker.register(oldWorkerURL, { scope })
      await navigator.serviceWorker.ready
    }, { oldWorkerURL, scope: scope.href })
    await page.reload()
    if (mode === 'modern') await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    else await expect(page.locator('#root')).toHaveText('Old cached portfolio')

    let navigations = 0
    page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations++ })
    const blockedAsset = '**/assets/AIgnite-*.webp'
    if (mode === 'failed legacy install') await context.route(blockedAsset, route => route.abort())
    await page.evaluate(({ workerURL, scope }) => navigator.serviceWorker.register(workerURL, {
      scope, updateViaCache: 'none',
    }), { workerURL, scope: scope.href })

    if (mode === 'failed legacy install') {
      await expect.poll(() => page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration()
        return !registration.installing && !registration.waiting && registration.active?.scriptURL.endsWith('old-fixture-sw.js')
      }), { timeout: 30000 }).toBe(true)
      await expect(page.locator('#root')).toHaveText('Old cached portfolio')
      expect(navigations).toBe(0)
      await context.unroute(blockedAsset)
      await page.evaluate(({ workerURL, scope }) => navigator.serviceWorker.register(workerURL, {
        scope, updateViaCache: 'none',
      }), { workerURL, scope: scope.href })
    }

    if (mode === 'modern') {
      await expect.poll(() => page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting)), {
        timeout: 30000,
      }).toBe(true)
      expect(navigations).toBe(0)
      const navigation = page.waitForEvent('framenavigated', frame => frame === page.mainFrame())
      await page.getByRole('button', { name: 'Reload', exact: true }).click({ timeout: 20000 })
      await navigation
    }
    await expect(page.locator('.portfolio-viewport')).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    expect(navigations).toBe(1)
    const preserved = await page.evaluate(async () => ({
      theme: localStorage.getItem('dinoweb-theme-v2'),
      unrelated: await caches.has('unrelated-test-cache'),
      migrationCaches: (await caches.keys()).filter(name => name.startsWith('dinoweb-legacy-upgrade-')),
    }))
    expect(preserved.theme).toBe('demain-soir-bleu')
    expect(preserved.unrelated).toBe(true)
    expect(preserved.migrationCaches).toHaveLength(0)
  })
}
