import { expect, test } from '@playwright/test'

const profiles = [
  { name: 'desktop without a memory API', cores: 8, memory: undefined, parallax: true },
  { name: 'low-end desktop without a memory API', cores: 2, memory: undefined, parallax: true },
  { name: 'desktop with 2 GB memory', cores: 8, memory: 2, parallax: true },
  { name: 'desktop with 4 GB memory', cores: 8, memory: 4, parallax: true },
  { name: 'mobile without a memory API', cores: 8, memory: undefined, mobile: true, parallax: false },
  { name: 'tablet portrait', cores: 8, memory: 8, mobile: true, viewport: { width: 820, height: 1180 }, parallax: false },
  { name: 'tablet landscape', cores: 8, memory: 4, mobile: true, viewport: { width: 1180, height: 820 }, parallax: false },
  { name: 'desktop with reduced motion', cores: 8, memory: 8, reduced: true, parallax: false },
]

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({
      viewport: profile.viewport || (profile.mobile ? { width: 430, height: 800 } : { width: 1440, height: 900 }),
      isMobile: Boolean(profile.mobile),
      hasTouch: Boolean(profile.mobile),
      reducedMotion: profile.reduced ? 'reduce' : 'no-preference',
    })

    test('preserves the intended effects and device budget', async ({ page }) => {
      await page.addInitScript(({ memory, cores }) => {
        Object.defineProperty(navigator, 'deviceMemory', { get: () => memory })
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores })
      }, profile)
      await page.goto('./')
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      await expect(page.locator('.home-stage-backdrop__shadow')).toBeVisible()
      const floor = page.locator('.home-stage-backdrop .home-stage-backdrop__floor')
      await expect(floor).toBeVisible()
      const motion = () => page.evaluate(() => ({
        floor: getComputedStyle(document.querySelector('.home-stage-backdrop__floor'), '::before').transform,
        background: getComputedStyle(document.querySelector('.void-grid-drift')).transform,
      }))
      const before = await motion()
      await page.waitForTimeout(400)
      const after = await motion()
      if (profile.reduced) expect(after).toEqual(before)
      else {
        expect(after.floor).not.toBe(before.floor)
        expect(after.background).not.toBe(before.background)
      }
      if (profile.parallax) {
        const backdrop = page.locator('.portfolio-viewport')
        await page.mouse.move(1300, 750)
        await expect.poll(() => backdrop.evaluate(element =>
          parseFloat(element.style.getPropertyValue('--floor-camera-x'))
        )).toBeLessThan(-10)
        await expect.poll(() => page.locator('.cube-breath').evaluate(element =>
          element.getAnimations().some(animation => animation.effect.getTiming().iterations === Infinity)
        )).toBe(true)
      }
    })
  })
}
