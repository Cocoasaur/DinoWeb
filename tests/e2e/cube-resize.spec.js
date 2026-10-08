import { expect, test } from '@playwright/test'

const profiles = [
  { name: 'desktop worker' },
  { name: 'touch worker', touch: true },
  { name: 'low-end worker', touch: true, low: true },
  { name: 'desktop fallback', fallback: true },
  { name: 'low-end fallback', touch: true, low: true, fallback: true },
  { name: 'reduced motion worker', touch: true, reduced: true },
]

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ viewport: { width: 1440, height: 900 }, hasTouch: !!profile.touch,
      isMobile: !!profile.touch, deviceScaleFactor: 2, serviceWorkers: 'block',
      reducedMotion: profile.reduced ? 'reduce' : 'no-preference' })
    test('keeps rendered frames proportional across rapid viewport switches', async ({ page }, testInfo) => {
      test.setTimeout(60000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(profile => {
        if (window.top !== window || location.protocol !== 'http:') return
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
        if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
        window.__brandStarts = 0
        window.__startupCLS = 0
        window.__layoutObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__startupCLS += entry.value
        })
        window.__layoutObserver.observe({ type: 'layout-shift', buffered: true })
        document.addEventListener('animationstart', event => {
          if (event.animationName === 'brand-outline-draw') window.__brandStarts++
        }, true)
      }, profile)
      await page.goto('./')
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      if (!profile.reduced) await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
      await expect.poll(() => page.locator('.brand-wordmark .web-trace').evaluateAll(paths =>
        paths.filter(path => path.ownerSVGElement.getBoundingClientRect().width > 0)
          .every(path => parseFloat(getComputedStyle(path).strokeDashoffset) === 0))).toBe(true)
      const starts = await page.evaluate(() => window.__brandStarts)
      const startupCLS = await page.evaluate(() => { window.__layoutObserver.disconnect(); return window.__startupCLS })
      if (!profile.fallback) expect(startupCLS).toBeLessThan(.005)
      await testInfo.attach('startup layout shift', { body: JSON.stringify({ startupCLS }), contentType: 'application/json' })
      await page.evaluate(() => {
        window.__resizeFrames = []
        const sample = () => {
          const canvas = document.querySelector('.cube-entrance canvas')
          if (canvas?.width && canvas?.height) {
            const rect = canvas.getBoundingClientRect()
            // Compare actual displayed pixels to their backing image on EVERY
            // frame, including frames before the async renderer catches up.
            window.__resizeFrames.push({ time: performance.now(), viewport: [innerWidth, innerHeight],
              bitmap: [canvas.width, canvas.height], css: [rect.width, rect.height],
              ratio: (rect.width / canvas.width) / (rect.height / canvas.height) })
          }
          window.__resizeFrame = requestAnimationFrame(sample)
        }
        sample()
      })
      for (const viewport of [
        { width: 430, height: 800 }, { width: 1440, height: 900 },
        { width: 820, height: 1180 }, { width: 1180, height: 820 },
        { width: 430, height: 800 }, { width: 1440, height: 900 },
      ]) {
        await page.setViewportSize(viewport)
        await expect.poll(() => page.locator('.cube-entrance canvas').evaluate(canvas => {
          const host = canvas.parentElement
          // The fallback measures its uniformly breathing wrapper, so its
          // buffer can be slightly larger while keeping the correct aspect.
          return canvas.width > 0 && canvas.height > 0 &&
            Math.abs(canvas.width / canvas.height - host.clientWidth / host.clientHeight) < .003
        })).toBe(true)
        await page.waitForTimeout(200)
      }
      const frames = await page.evaluate(() => { cancelAnimationFrame(window.__resizeFrame); return window.__resizeFrames })
      expect(frames.length).toBeGreaterThan(10)
      expect(Math.max(...frames.map(frame => Math.abs(frame.ratio - 1)))).toBeLessThan(.01)
      expect(await page.evaluate(() => window.__brandStarts)).toBe(starts)
      await testInfo.attach('viewport frame proportions', { body: JSON.stringify(frames), contentType: 'application/json' })
      await page.screenshot({ path: testInfo.outputPath('resized-home.png') })
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}
