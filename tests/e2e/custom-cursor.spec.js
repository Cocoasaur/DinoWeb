import { expect, test } from '@playwright/test'
import { existsSync } from 'node:fs'

async function loadHome(page, low = false) {
  await page.addInitScript(low => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => low ? 2 : 8 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => low ? 2 : 8 })
  }, low)
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
}

// Keep OS scrollbars visible so tests detect any unintended native gutter.
test.use({
  viewport: { width: 1440, height: 900 },
  serviceWorkers: 'block',
  launchOptions: {
    ...(existsSync('/usr/bin/google-chrome-stable') ? { executablePath: '/usr/bin/google-chrome-stable' } : {}),
    ignoreDefaultArgs: ['--hide-scrollbars'],
  },
})

test('tracks precisely, reacts to cube dragging, and covers text controls and restores accessibility cursors', async ({ page }, testInfo) => {
  await loadHome(page)
  const cursor = page.locator('.portfolio-cursor')
  const html = page.locator('html')
  await expect(cursor).toHaveCount(1)
  await page.mouse.move(120, 120)
  await expect(html).toHaveAttribute('data-custom-cursor', 'active')
  await expect(cursor).toHaveAttribute('data-visible', 'true')
  await expect(cursor).toHaveCSS('pointer-events', 'none')

  await page.mouse.move(260, 180, { steps: 5 })
  for (const part of ['point', 'follower']) {
    await expect.poll(() => page.locator(`.portfolio-cursor__${part}`).evaluate(el => {
      const box = el.getBoundingClientRect()
      return Math.hypot(box.x + box.width / 2 - 260, box.y + box.height / 2 - 180)
    })).toBeLessThan(1)
  }
  await page.mouse.down()
  await expect(cursor).toHaveAttribute('data-mode', 'drag')
  await expect(cursor).toHaveAttribute('data-pressed', 'true')
  await page.mouse.move(300, 210, { steps: 8 })
  await page.mouse.up()
  await expect(cursor).toHaveAttribute('data-pressed', 'false')

  // Text controls use the site cursor while retaining normal text editing.
  await page.evaluate(() => {
    const input = document.createElement('input')
    input.setAttribute('aria-label', 'Cursor fallback check')
    input.style.cssText = 'position:fixed;left:60px;top:60px;width:180px;height:44px;z-index:2000'
    document.body.appendChild(input)
  })
  const input = page.getByRole('textbox', { name: 'Cursor fallback check' })
  await input.hover()
  await expect(html).toHaveAttribute('data-custom-cursor', 'active')
  await expect(input).toHaveCSS('cursor', 'none')
  await expect(cursor).toHaveAttribute('data-mode', 'text')
  await input.fill('Text editing still works')
  await expect(input).toHaveValue('Text editing still works')
  await input.evaluate(el => el.remove())

  await page.mouse.move(180, 140)
  await expect(html).toHaveAttribute('data-custom-cursor', 'active')
  await page.keyboard.press('Tab')
  await expect(html).not.toHaveAttribute('data-custom-cursor')
  await expect(cursor).toHaveAttribute('data-visible', 'false')

  await page.mouse.move(200, 150)
  await expect(html).toHaveAttribute('data-custom-cursor', 'active')
  await page.emulateMedia({ forcedColors: 'active' })
  await expect(html).not.toHaveAttribute('data-custom-cursor')
  await expect(cursor).toHaveCount(0)
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'reduce' })
  await expect(cursor).toHaveCount(0)
  await expect(html).not.toHaveAttribute('data-custom-cursor')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(cursor).toHaveCount(1)
  await page.mouse.move(210, 160)
  await expect(html).toHaveAttribute('data-custom-cursor', 'active')
  await page.screenshot({ path: testInfo.outputPath('cursor-home.png') })
})

test('keeps the custom cursor on mouse-driven desktops with low device reports', async ({ page }) => {
  await loadHome(page, true)
  await expect(page.locator('.portfolio-cursor')).toHaveCount(1)
  await page.mouse.move(200, 150)
  await expect(page.locator('html')).toHaveAttribute('data-custom-cursor', 'active')
  await expect(page.locator('.portfolio-cursor')).toHaveAttribute('data-visible', 'true')
})

test('keeps the mouse cursor across layout breakpoints without overriding device reports', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  for (const width of [1440, 640, 900]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('.portfolio-cursor')).toHaveCount(1)
    await page.mouse.move(120, 120)
    await expect(page.locator('html')).toHaveAttribute('data-custom-cursor', 'active')
  }
})

test('tracks captured drags even when a control stops pointer events bubbling', async ({ page }) => {
  await loadHome(page)
  await expect(page.locator('.portfolio-cursor')).toHaveCount(1)
  await page.evaluate(() => {
    const surface = document.createElement('div')
    surface.id = 'cursor-drag-fixture'
    surface.style.cssText = 'position:fixed;left:80px;top:80px;width:320px;height:180px;z-index:500;background:white'
    surface.addEventListener('pointerdown', event => {
      surface.setPointerCapture(event.pointerId)
      event.stopPropagation()
    })
    surface.addEventListener('pointermove', event => event.stopPropagation())
    surface.addEventListener('pointerup', event => {
      surface.releasePointerCapture(event.pointerId)
      event.stopPropagation()
    })
    document.body.appendChild(surface)
  })
  const cursor = page.locator('.portfolio-cursor')
  await page.mouse.move(130, 130)
  await page.mouse.down()
  await expect(cursor).toHaveAttribute('data-pressed', 'true')
  await page.mouse.move(260, 180, { steps: 8 })
  for (const part of ['point', 'follower']) {
    const distance = await page.locator(`.portfolio-cursor__${part}`).evaluate(el => {
      const rect = el.getBoundingClientRect()
      return Math.hypot(rect.x + rect.width / 2 - 260, rect.y + rect.height / 2 - 180)
    })
    expect(distance).toBeLessThan(1)
  }
  await page.mouse.up()
  await expect(cursor).toHaveAttribute('data-pressed', 'false')
})

test('keeps the cursor exact while dragging custom scrollbars on both axes', async ({ page }, testInfo) => {
  await loadHome(page)
  await expect(page.locator('.portfolio-cursor')).toHaveCount(1)
  await page.evaluate(() => {
    const surface = document.createElement('div')
    surface.id = 'cursor-scroll-fixture'
    surface.dataset.customScroll = ''
    surface.style.cssText = 'position:fixed;left:80px;top:80px;width:320px;height:180px;overflow:scroll;z-index:100;background:white;border:1px solid black'
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 600
    canvas.style.display = 'block'
    surface.appendChild(canvas)
    document.body.appendChild(surface)
  })
  const scroller = page.locator('#cursor-scroll-fixture')
  const cursor = page.locator('.portfolio-cursor')
  const html = page.locator('html')
  await expect(scroller).toHaveAttribute('data-scrollbars', 'custom')
  await page.mouse.move(130, 130)
  await expect(cursor).toHaveAttribute('data-mode', 'default')
  await expect(page.locator('.portfolio-cursor__label')).toHaveText('')
  expect(await scroller.evaluate(el => el.offsetWidth - el.clientWidth)).toBe(2)
  for (const orientation of ['horizontal', 'vertical']) {
    const bar = page.locator(`[role="scrollbar"][aria-controls="cursor-scroll-fixture"][aria-orientation="${orientation}"]`)
    await expect(bar).toBeVisible()
    const thumb = await bar.locator('span').boundingBox()
    const x = thumb.x + thumb.width / 2, y = thumb.y + thumb.height / 2
    await page.mouse.move(x, y)
    await expect(html).toHaveAttribute('data-custom-cursor', 'active')
    await expect(page.locator('.portfolio-cursor__label')).toHaveText('SCROLL')
    await page.mouse.down()
    const endX = x + (orientation === 'horizontal' ? 80 : 0)
    const endY = y + (orientation === 'vertical' ? 80 : 0)
    await page.mouse.move(endX, endY, { steps: 10 })
    await expect(cursor).toHaveAttribute('data-visible', 'true')
    await expect(cursor).toHaveAttribute('data-pressed', 'true')
    for (const part of ['point', 'follower']) {
      const distance = await page.locator(`.portfolio-cursor__${part}`).evaluate((el, p) => {
        const rect = el.getBoundingClientRect()
        return Math.hypot(rect.x + rect.width / 2 - p.x, rect.y + rect.height / 2 - p.y)
      }, { x: endX, y: endY })
      expect(distance).toBeLessThan(1)
    }
    await page.mouse.up()
    await expect(cursor).toHaveAttribute('data-pressed', 'false')
    expect(await scroller.evaluate((el, vertical) => vertical ? el.scrollTop : el.scrollLeft, orientation === 'vertical')).toBeGreaterThan(100)
    await bar.focus()
    await page.keyboard.press('End')
    await expect(bar).toHaveAttribute('aria-valuenow', '100')
    await page.keyboard.press('Home')
    await expect(bar).toHaveAttribute('aria-valuenow', '0')
  }
  await page.mouse.move(130, 130)
  await page.mouse.wheel(0, 80)
  await expect(cursor).toHaveAttribute('data-visible', 'true')
  await expect(cursor).toHaveAttribute('data-mode', 'default')
  await page.screenshot({ path: testInfo.outputPath('cursor-after-scrollbar-drag.png') })
  await scroller.evaluate(el => {
    const parent = document.createElement('div')
    parent.id = 'cursor-parent-scroll'
    parent.dataset.customScroll = ''
    parent.style.cssText = 'position:fixed;left:80px;top:80px;width:320px;height:400px;overflow:auto;z-index:100;background:white'
    el.before(parent)
    parent.appendChild(el)
    el.style.position = 'relative'
    el.style.left = el.style.top = '0'
    const filler = document.createElement('div')
    filler.style.height = '700px'
    parent.appendChild(filler)
    el.scrollTop = el.scrollHeight
  })
  const nestedBar = page.locator('[role="scrollbar"][aria-controls="cursor-scroll-fixture"][aria-orientation="vertical"]')
  await expect(page.locator('#cursor-parent-scroll')).toHaveAttribute('data-scrollbars', 'custom')
  await expect(nestedBar).toHaveAttribute('aria-valuenow', '100')
  await nestedBar.locator('span').hover()
  await page.mouse.wheel(0, 100)
  await expect.poll(() => page.locator('#cursor-parent-scroll').evaluate(el => el.scrollTop)).toBeGreaterThan(0)
  await expect(cursor).toHaveAttribute('data-visible', 'true')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[role="scrollbar"]')).toHaveCount(0)
  await expect(scroller).not.toHaveAttribute('data-scrollbars')
})

test.describe('touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  test('keeps normal touch interaction without a cursor overlay', async ({ page }) => {
    await loadHome(page)
    await page.touchscreen.tap(60, 100)
    await expect(page.locator('.portfolio-cursor')).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveAttribute('data-custom-cursor')
  })
})
