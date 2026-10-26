import { expect, test } from '@playwright/test'
import { openContacts } from './helpers/skills.js'

for (const profile of [
  { name: 'desktop blue', width: 1440, height: 900, dark: true },
  { name: 'phone', width: 390, height: 844, touch: true },
]) test.describe(`Contact opening: ${profile.name}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, serviceWorkers: 'block' })

  test('reveals the introduction continuously without a flash or reset', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    await page.addInitScript(dark => {
      localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur')
      window.contactOpeningFrames = []
      let started = 0
      const sample = now => {
        const root = document.querySelector('.contacts-page')
        if (root?.closest('[role="dialog"]')?.dataset.phase === 'open') {
          if (!started) {
            started = now
            // A normal viewport refresh must not take ownership of an entrance.
            setTimeout(() => window.dispatchEvent(new Event('resize')), 80)
          }
          window.contactOpeningFrames.push({ time: now - started,
            elements: [...root.querySelectorAll('.contact-introduction [data-contact-reveal]')].map(el => {
              const style = getComputedStyle(el)
              return { opacity: Number(style.opacity), y: new DOMMatrixReadOnly(style.transform).m42 }
            }) })
          if (now - started > 1200) { window.contactOpeningComplete = true; return }
        }
        requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    }, !!profile.dark)
    await openContacts(page, profile)
    await expect.poll(() => page.evaluate(() => window.contactOpeningComplete)).toBe(true)
    const frames = await page.evaluate(() => window.contactOpeningFrames)
    await testInfo.attach('opening-frames', { body: JSON.stringify(frames), contentType: 'application/json' })
    for (let item = 0; item < 3; item++) {
      const samples = frames.map(frame => frame.elements[item])
      expect(samples.filter(sample => sample.opacity > .02 && sample.opacity < .98).length).toBeGreaterThan(3)
      for (let frame = 1; frame < samples.length; frame++) {
        expect(samples[frame].opacity, `intro ${item} opacity must not restart at frame ${frame}`).toBeGreaterThanOrEqual(samples[frame - 1].opacity - .02)
        expect(samples[frame].y, `intro ${item} must keep moving toward rest`).toBeLessThanOrEqual(samples[frame - 1].y + .5)
      }
      expect(samples.at(-1)).toEqual({ opacity: 1, y: 0 })
    }
    await expect(page.locator('.portfolio-overlay-panel[data-page="contacts"]')).toHaveJSProperty('scrollTop', 0)
  })
})
