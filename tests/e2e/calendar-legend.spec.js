import { expect, test } from '@playwright/test'
import { openAbout } from './helpers/skills.js'

const profiles = [
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'blue phone', width: 430, height: 800, touch: true, dark: true },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'narrow desktop', width: 640, height: 900 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'reduced motion', width: 430, height: 800, touch: true, reduced: true },
]

for (const profile of profiles) test.describe(`Calendar legend: ${profile.name}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch,
    hasTouch: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })

  test('stays at the visible right edge while the months scroll', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    await page.addInitScript(dark => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
      localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur')
    }, !!profile.dark)
    await page.route('https://github-contributions-api.jogruber.de/**', route => route.fulfill({
      json: { contributions: [{ date: `${new Date().getFullYear()}-01-01`, level: 2, count: 3 }] },
    }))
    await openAbout(page, profile)
    const calendar = page.locator('.about-contributions-calendar')
    const legend = page.locator('.about-contributions-legend')
    await page.locator('.about-contributions').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await calendar.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    // Deferred PDF loading above the calendar changes the panel's scroll geometry.
    await expect(page.locator('.about-cv-page-wrap').first()).toHaveAttribute('aria-busy', 'false', { timeout: 15000 })
    await calendar.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    await expect(page.locator('.about-contributions-body')).toHaveCSS('opacity', '1')
    await expect.poll(() => calendar.locator('.about-contributions-grid .about-contributions-day').count()).toBeGreaterThan(350)
    const range = await calendar.evaluate(el => el.scrollWidth - el.clientWidth)
    if (profile.width < 700) expect(range).toBeGreaterThan(0)

    const assertPinned = async () => {
      await expect(legend).toBeInViewport({ ratio: 1 })
      await expect(legend).toContainText('Less')
      await expect(legend).toContainText('More')
      await expect.poll(() => legend.evaluate(el => {
        const calendar = el.closest('.about-contributions-body').querySelector('.about-contributions-calendar')
        const viewport = calendar.getBoundingClientRect()
        const box = el.getBoundingClientRect()
        return Math.abs(box.right - viewport.left - calendar.clientLeft - calendar.clientWidth)
      }), { message: 'legend stays aligned to the calendar viewport rather than the scrolled year' }).toBeLessThan(1)
    }
    for (const fraction of [0, .25, .5, .75, 1, .5, 0]) {
      await calendar.evaluate((el, ratio) => { el.scrollLeft = (el.scrollWidth - el.clientWidth) * ratio }, fraction)
      await assertPinned()
      if (fraction === .5) await page.locator('.about-contributions-cell').screenshot({ path: testInfo.outputPath('legend-mid-scroll.png') })
    }

    if (profile.touch && range > 0) {
      const session = await page.context().newCDPSession(page)
      const box = await calendar.boundingBox()
      const start = { x: box.x + box.width * .8, y: box.y + 35 }
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
      for (let step = 1; step <= 10; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x - box.width * .55 * step / 10, y: start.y }] })
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect.poll(() => calendar.evaluate(el => el.scrollLeft)).toBeGreaterThan(0)
      await assertPinned()
      await session.detach()
    }
  })
})
