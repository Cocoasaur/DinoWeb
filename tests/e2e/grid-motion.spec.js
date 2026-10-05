import { expect, test } from '@playwright/test'

const profiles = [
  { name: 'phone', width: 430, height: 800, memory: 8, cores: 8 },
  { name: 'phone fallback', width: 430, height: 800, memory: 8, cores: 8, fallback: true },
  { name: 'low-end phone at 6× CPU slowdown', width: 430, height: 800, memory: 2, cores: 2, slow: true },
  { name: 'portrait tablet', width: 820, height: 1180, memory: 8, cores: 8 },
  { name: 'landscape tablet', width: 1180, height: 820, memory: 4, cores: 8 },
]

async function loadHome(page, profile) {
  await page.addInitScript(profile => {
    Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.memory })
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.cores })
    if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
    window.__glDraws = 0
    for (const name of ['drawArrays', 'drawElements']) {
      const native = WebGL2RenderingContext.prototype[name]
      WebGL2RenderingContext.prototype[name] = function (...args) { window.__glDraws++; return native.apply(this, args) }
    }
  }, profile)
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 45000 })
}

const motion = page => page.evaluate(() => ({
  x: parseFloat(document.querySelector('.portfolio-viewport').style.getPropertyValue('--floor-camera-x')),
  floor: getComputedStyle(document.querySelector('.home-stage-backdrop__floor')).transform,
  background: getComputedStyle(document.querySelector('.home-grid-parallax')).transform,
}))

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
    test('moves both grids on real touch, cancels pinches, and keeps idle WebGL asleep', async ({ page, context }, testInfo) => {
      test.setTimeout(60000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      const session = await context.newCDPSession(page)
      if (profile.slow) await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
      await loadHome(page, profile)
      const before = await motion(page)
      const start = { x: profile.width / 2, y: profile.height * .6 }
      const moved = { x: start.x + 100, y: start.y - 70 }
      const touch = (type, points) => session.send('Input.dispatchTouchEvent', {
        type, touchPoints: points.map((point, id) => ({ ...point, id, radiusX: 1, radiusY: 1 })),
      })
      await touch('touchStart', [start])
      await touch('touchMove', [moved])
      await expect.poll(async () => (await motion(page)).x).toBeLessThan(-3)
      await page.waitForTimeout(950)
      const after = await motion(page)
      expect(after.floor).not.toBe(before.floor)
      expect(after.background).not.toBe(before.background)
      await testInfo.attach('touch grid movement', { body: await page.screenshot({ scale: 'css' }), contentType: 'image/png' })
      const draws = () => page.evaluate(() => Number(document.querySelector('[data-scene-draws]')?.dataset.sceneDraws || window.__glDraws))
      await expect.poll(async () => {
        const before = await draws()
        await page.waitForTimeout(250)
        return await draws() === before
      }, { timeout: 10000 }).toBe(true)
      await touch('touchEnd', [])
      await expect.poll(async () => (await motion(page)).x).toBe(0)
      // A second finger cancels parallax and does not compete with pinch zoom.
      await touch('touchStart', [start])
      await touch('touchMove', [moved])
      await expect.poll(async () => (await motion(page)).x).toBeLessThan(-3)
      await touch('touchStart', [moved, { x: moved.x + 30, y: moved.y }])
      await expect.poll(async () => (await motion(page)).x).toBe(0)
      await touch('touchCancel', [])
      await expect(page.getByRole('dialog')).toHaveCount(0)
      // Both the event-driven response and idle drift pause in a hidden tab.
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await expect(page.locator('.void-grid-drift')).toHaveCSS('animation-play-state', 'paused')
      expect(await page.locator('.home-stage-backdrop__floor').evaluate(el => getComputedStyle(el, '::before').animationPlayState)).toBe('paused')
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await expect(page.locator('.void-grid-drift')).toHaveCSS('animation-play-state', 'running')
      expect(errors).toEqual([])
    })
  })
}

test('desktop background and floor follow the cursor, return smoothly, and respect reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await loadHome(page, { memory: 8, cores: 8 })
  const before = await motion(page)
  await page.mouse.move(1300, 750)
  await expect.poll(async () => (await motion(page)).x).toBeLessThan(-20)
  await page.waitForTimeout(900)
  const after = await motion(page)
  expect(after.floor).not.toBe(before.floor)
  expect(after.background).not.toBe(before.background)
  await expect.poll(async () => (await motion(page)).x, { timeout: 6000 }).toBe(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.mouse.move(100, 100)
  await page.waitForTimeout(300)
  expect((await motion(page)).x).toBe(0)
  await expect(page.locator('.home-grid-parallax')).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  expect(await page.locator('.home-stage-backdrop__floor').evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none')
})
