import { expect, test } from '@playwright/test'
import { openSkills } from './helpers/skills.js'

const profiles = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'blue theme phone', width: 390, height: 844, dark: true },
  { name: 'landscape phone', width: 844, height: 390 },
  { name: 'low-end phone', width: 430, height: 800, low: true },
  { name: 'reduced motion', width: 430, height: 800, reduced: true },
]

const matrix = locator => locator.evaluate(el => Array.from(new DOMMatrixReadOnly(getComputedStyle(el).transform).toFloat64Array()))
async function difference(locator, baseline) {
  return Math.max(...(await matrix(locator)).map((value, index) => Math.abs(value - baseline[index])))
}
async function center(locator) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  const box = await locator.boundingBox()
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

for (const profile of profiles) {
  test.describe(`Skills touch: ${profile.name}`, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: true, isMobile: true,
      reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })

    test('supports real finger feedback without trapping scrolling or controls', async ({ page, context }, testInfo) => {
      test.setTimeout(90000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(low => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => low ? 2 : 8 })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => low ? 2 : 8 })
      }, !!profile.low)
      if (profile.dark) await page.addInitScript(() => localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu'))
      await openSkills(page, profile)
      const root = page.locator('.skills-page')
      const panel = page.locator('.portfolio-overlay-panel[data-page="skills"]')
      const stage = root.locator('.skills-stack-stage')
      const rig = root.locator('.skills-stack-rig')
      const session = await context.newCDPSession(page)
      const touch = (type, points = []) => session.send('Input.dispatchTouchEvent', {
        type, touchPoints: points.map((point, id) => ({ ...point, id, radiusX: 2, radiusY: 2 })),
      })
      const swipeUp = async locator => {
        const start = await center(locator)
        const before = await panel.evaluate(el => el.scrollTop)
        await touch('touchStart', [start])
        for (let step = 1; step <= 8; step++) {
          await touch('touchMove', [{ x: start.x, y: start.y - step * 14 }])
          await page.waitForTimeout(20) // Give the browser a real pan gesture, rather than synthetic DOM events.
        }
        await touch('touchEnd')
        await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBeGreaterThan(before + 35)
        // Finish the native inertial pan before testing the next independent tap.
        await expect.poll(async () => {
          const previous = await panel.evaluate(el => el.scrollTop)
          await page.waitForTimeout(100)
          return Math.abs(await panel.evaluate(el => el.scrollTop) - previous)
        }).toBeLessThan(1)
      }
      let point = await center(stage)
      await expect(root.locator('.skills-stack-visual')).toHaveCSS('opacity', '1')
      const rest = await matrix(rig)
      await touch('touchStart', [point])
      if (!profile.reduced) await expect.poll(() => difference(rig, rest)).toBeGreaterThan(.003)
      else expect(await difference(rig, rest)).toBeLessThan(.001)
      const pressed = await matrix(rig)
      await touch('touchMove', [{ x: point.x + 55, y: point.y }])
      if (!profile.reduced) await expect.poll(() => difference(rig, pressed)).toBeGreaterThan(.003)
      await panel.screenshot({ path: testInfo.outputPath('finger-drag.png') })
      await touch('touchEnd')
      await expect.poll(() => difference(rig, rest)).toBeLessThan(.001)

      // A second finger or cancelled gesture must never leave the sculpture tilted.
      await touch('touchStart', [point])
      await touch('touchStart', [point, { x: point.x + 30, y: point.y }])
      await expect.poll(() => difference(rig, rest)).toBeLessThan(.001)
      await touch('touchCancel')
      await swipeUp(stage)
      await expect.poll(() => difference(rig, rest)).toBeLessThan(.001)

      const spread = root.getByRole('button', { name: 'Bring together' })
      await center(spread)
      await spread.tap()
      await expect(root.getByRole('button', { name: 'Spread layers' })).toHaveAttribute('aria-pressed', 'false')
      await expect.poll(() => root.locator('.skills-stack-layer').first().evaluate(el =>
        new DOMMatrixReadOnly(getComputedStyle(el).transform).m43)).toBeLessThanOrEqual(36.1)
      const backend = root.getByRole('button', { name: 'Backend 04' })
      await center(backend)
      await backend.tap()
      await expect(root.locator('.skills-tool-cell')).toHaveCount(4)
      await root.getByRole('button', { name: 'All skills 25' }).tap()
      await expect(root.locator('.skills-tool-cell')).toHaveCount(25)

      const cell = root.locator('.skills-tool-cell').first()
      const tilt = cell.locator('.skills-tool-tilt')
      await center(cell)
      await expect(cell.locator('.skills-tool-face')).toHaveCSS('opacity', '1')
      const cardRest = await matrix(tilt)
      const content = cell.locator('.skills-tool-content')
      const icon = content.locator('img')
      const idleFilter = profile.dark ? 'brightness(0) invert(1)' : 'grayscale(1)'
      const restingBackground = await content.evaluate(el => getComputedStyle(el).backgroundColor)
      await expect(icon).toHaveCSS('filter', idleFilter)
      point = await center(cell)
      await touch('touchStart', [point])
      await expect(tilt).toHaveAttribute('data-touch-active', 'true')
      await expect(icon).toHaveCSS('filter', 'none')
      await expect.poll(() => content.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(restingBackground)
      if (!profile.reduced) await expect.poll(() => difference(tilt, cardRest)).toBeGreaterThan(.003)
      else expect(await difference(tilt, cardRest)).toBeLessThan(.001)
      await touch('touchMove', [{ x: point.x + 35, y: point.y }])
      await touch('touchEnd')
      // A quick tap remains visible briefly, then clears without sticky hover.
      await expect(tilt).toHaveAttribute('data-touch-active', 'true')
      await panel.screenshot({ path: testInfo.outputPath('touch-highlight.png') })
      await expect(tilt).not.toHaveAttribute('data-touch-active')
      await expect(icon).toHaveCSS('filter', idleFilter)
      point = await center(cell)
      await touch('touchStart', [point])
      await expect(tilt).toHaveAttribute('data-touch-active', 'true')
      await touch('touchCancel')
      await expect(tilt).not.toHaveAttribute('data-touch-active')
      await expect.poll(() => difference(tilt, cardRest)).toBeLessThan(.001)
      await swipeUp(cell)
      await expect(tilt).not.toHaveAttribute('data-touch-active')
      await expect.poll(() => difference(tilt, cardRest)).toBeLessThan(.001)
      if (profile.name === 'phone') {
        for (const tile of await root.locator('.skills-tool-cell').all()) {
          const position = await center(tile)
          await expect(tile.locator('.skills-tool-face')).toHaveCSS('opacity', '1')
          await touch('touchStart', [position])
          await expect(tile.locator('.skills-tool-tilt')).toHaveAttribute('data-touch-active', 'true')
          await expect(tile.locator('img')).toHaveCSS('filter', 'none')
          await touch('touchEnd')
        }
      }
      expect(await panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
      expect(await panel.evaluate(el => el.parentElement.scrollTop)).toBe(0)
      await page.getByRole('button', { name: 'Close skills details' }).tap()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      expect(errors).toEqual([])
    })
  })
}

test('Skills mouse hover still settles and respects a reduced-motion change', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu'))
  await openSkills(page, { width: 1440, height: 900 })
  const stage = page.locator('.skills-stack-stage')
  const rig = page.locator('.skills-stack-rig')
  const point = await center(stage)
  const rest = await matrix(rig)
  await page.mouse.move(point.x + 60, point.y - 35)
  await expect.poll(() => difference(rig, rest)).toBeGreaterThan(.003)
  await page.mouse.move(5, 5)
  await expect.poll(() => difference(rig, rest)).toBeLessThan(.001)
  const cell = page.locator('.skills-tool-cell').first()
  const tilt = cell.locator('.skills-tool-tilt')
  const cardPoint = await center(cell)
  await expect(cell.locator('.skills-tool-face')).toHaveCSS('transform', 'none')
  await expect(cell.locator('.skills-tool-face')).toHaveCSS('opacity', '1')
  const cardRest = await matrix(tilt)
  await expect.poll(() => page.locator('.skills-tool-content img').evaluateAll(images => images.every(img => getComputedStyle(img).filter === 'brightness(0) invert(1)'))).toBe(true)
  await page.mouse.move(cardPoint.x + 20, cardPoint.y - 20)
  await expect.poll(() => difference(tilt, cardRest)).toBeGreaterThan(.003)
  await expect(cell.locator('img')).toHaveCSS('filter', 'none')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(tilt).toHaveCSS('transform', 'none')
  const reducedPoint = await center(stage)
  const reducedRest = await matrix(rig)
  await page.mouse.move(reducedPoint.x + 60, reducedPoint.y - 35)
  expect(await difference(rig, reducedRest)).toBeLessThan(.001)
})
