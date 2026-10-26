import { expect, test } from '@playwright/test'

for (const profile of [
  { name: 'desktop light', width: 1440, height: 900 },
  { name: 'desktop blue', width: 1440, height: 900, dark: true },
  { name: 'phone light', width: 390, height: 844, touch: true },
]) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch,
    hasTouch: !!profile.touch, serviceWorkers: 'block' })

  test('reloads without changing floor geometry or jumping between loader and live grid tiles', async ({ page }) => {
    test.setTimeout(90000)
    await page.addInitScript(dark => {
      localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur')
      window.startupFloorFrames = []
      const sample = () => {
        const floor = document.querySelector('.home-stage-backdrop > .home-stage-backdrop__floor')
        if (floor) {
          const transform = getComputedStyle(floor).transform
          if (transform !== 'none') window.startupFloorFrames.push(transform)
        }
        window.startupFloorRAF = requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    }, !!profile.dark)
    for (let pass = 0; pass < 2; pass++) {
      let release
      const gate = new Promise(resolve => { release = resolve })
      await page.route('**/assets/John_Arquesola_Resume-*.pdf', async route => { await gate; await route.continue() })
      try {
        if (pass) await page.reload(); else await page.goto('./')
        const boot = page.locator('.boot-screen .home-stage-backdrop__floor')
        const live = page.locator('.home-stage-backdrop > .home-stage-backdrop__floor')
        await expect(live).toHaveCount(1, { timeout: 30000 })
        await expect(page.locator('.cube-entrance canvas')).toHaveCount(1)
        const geometry = el => {
          const style = getComputedStyle(el), tiles = getComputedStyle(el, '::before')
          return { transform: style.transform, transition: style.transitionDuration,
            content: tiles.content, background: tiles.backgroundImage, size: tiles.backgroundSize,
            position: tiles.backgroundPosition, inset: tiles.inset, drift: tiles.transform,
            paused: tiles.animationPlayState }
        }
        const loading = await boot.evaluate(geometry)
        const waiting = await live.evaluate(geometry)
        expect(loading).toEqual(waiting)
        expect(loading.transition).toBe('0s')
        expect(loading.content).not.toBe('none')
        expect(loading.paused).toBe('paused')
      } finally { release() }
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      await page.waitForTimeout(300)
      const frames = await page.evaluate(() => { cancelAnimationFrame(window.startupFloorRAF); return window.startupFloorFrames })
      expect(frames.length).toBeGreaterThan(5)
      expect(new Set(frames).size, 'the floor never rotates or translates during startup').toBe(1)
      await page.unroute('**/assets/John_Arquesola_Resume-*.pdf')
    }
  })
})
