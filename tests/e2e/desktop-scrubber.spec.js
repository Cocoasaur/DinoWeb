import { expect, test } from '@playwright/test'

const profiles = [
  { name: 'high desktop', memory: 8, cores: 8, network: '4g' },
  { name: 'medium desktop', memory: 4, cores: 8, network: '4g' },
  { name: 'slow connection desktop', memory: 8, cores: 8, network: '3g' },
  { name: 'low-end desktop', memory: 2, cores: 2, network: '4g', low: true },
  { name: 'touch tablet', memory: 8, cores: 8, network: '4g', touch: true },
  { name: 'reduced motion desktop', memory: 8, cores: 8, network: '4g', reduced: true },
]

for (const profile of profiles) test.describe(profile.name, () => {
  test.use({ viewport: { width: 1440, height: 900 }, isMobile: !!profile.touch,
    hasTouch: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })
  test('keeps the mouse bar inside the desktop viewport independent of cube quality', async ({ page }, testInfo) => {
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.cores })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.memory })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: profile.network, saveData: false }) })
    }, profile)
    if (profile.low) {
      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    }
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    const bar = page.locator('.scrubber-entrance')
    if (profile.touch || profile.reduced) {
      await expect(bar).toHaveCount(0)
      return
    }
    await expect(bar).toBeVisible()
    const bounds = await bar.boundingBox()
    expect(bounds.width).toBe(8)
    expect(bounds.x).toBeGreaterThan(0)
    expect(bounds.x + bounds.width).toBeLessThan(1440)
    expect(bounds.y).toBeGreaterThan(0)
    expect(bounds.y + bounds.height).toBeLessThan(900)
    const dot = bar.locator('div').nth(1)
    // Test real mouse input and rendered dot bounds, not merely DOM presence.
    for (const y of [90, 810]) {
      await page.mouse.move(900, y)
      await expect.poll(async () => {
        const marker = await dot.boundingBox()
        return Math.abs(marker.y + marker.height / 2 - (bounds.y + y / 900 * bounds.height))
      }).toBeLessThan(1)
      const marker = await dot.boundingBox()
      expect(marker.x).toBeGreaterThan(0)
      expect(marker.x + marker.width).toBeLessThan(1440)
      expect(marker.y).toBeGreaterThan(0)
      expect(marker.y + marker.height).toBeLessThan(900)
    }
    if (profile.name === 'medium desktop') await page.screenshot({ path: testInfo.outputPath('desktop-cursor-bar.png'), scale: 'css' })
    // Preserve the tablet width boundary and restore the same bar on resize.
    await page.setViewportSize({ width: 1023, height: 900 })
    await expect(bar).toBeHidden()
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(bar).toBeVisible()
  })
})
