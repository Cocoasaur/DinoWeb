import { expect, test } from '@playwright/test'

const profiles = [
  { name: 'desktop without a memory API', cores: 8, memory: undefined, floor: true },
  { name: 'low-end desktop without a memory API', cores: 2, memory: undefined, floor: false },
  { name: 'desktop with 2 GB memory', cores: 8, memory: 2, floor: false },
  { name: 'desktop with 4 GB memory', cores: 8, memory: 4, floor: false },
  { name: 'mobile without a memory API', cores: 8, memory: undefined, mobile: true, floor: false },
  { name: 'desktop with reduced motion', cores: 8, memory: 8, reduced: true, floor: false },
]

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({
      viewport: profile.mobile ? { width: 430, height: 800 } : { width: 1440, height: 900 },
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
      await expect(floor).toHaveCount(profile.floor ? 1 : 0)
      if (profile.floor) {
        const backdrop = page.locator('.home-stage-backdrop')
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
