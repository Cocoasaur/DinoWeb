import { assertPinnedHeader } from './helpers/pinned-header.js'
import { expect, test } from '@playwright/test'
import { openSkills } from './helpers/skills.js'

const profiles = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'short desktop', width: 1518, height: 780 },
  { name: 'blue theme', width: 1440, height: 900, dark: true },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'portrait monitor', width: 900, height: 1440 },
  { name: 'small phone', width: 320, height: 700, touch: true },
  { name: 'landscape phone', width: 844, height: 390, touch: true },
  { name: 'reduced motion', width: 430, height: 800, touch: true, reduced: true, low: true },
]

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch,
      hasTouch: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })

    test('keeps the toolkit readable through filtering, scrolling, and reopening', async ({ page }, testInfo) => {
      test.setTimeout(90000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(low => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => low ? 2 : 8 })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => low ? 2 : 8 })
      }, !!profile.low)
      if (profile.dark) await page.addInitScript(() => localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu'))
      const face = await openSkills(page, profile)
      const root = page.locator('.skills-page')
      const panel = page.locator('.portfolio-overlay-panel[data-page="skills"]')
      const panelTop = await panel.evaluate(el => el.getBoundingClientRect().top)
      expect(panelTop).toBeGreaterThan(0)
      const centered = () => panel.evaluate(el => {
        const frame = el.closest('.portfolio-overlay-frame')
        return { top: frame.getBoundingClientRect().top,
          bottomGap: innerHeight - frame.getBoundingClientRect().bottom,
          outerScroll: frame.parentElement.scrollTop }
      })
      const assertCentered = async () => {
        await expect.poll(async () => {
          const box = await centered()
          return Math.abs(box.top - box.bottomGap)
        }).toBeLessThan(1)
        expect((await centered()).top).toBeGreaterThan(0)
        expect((await centered()).outerScroll).toBe(0)
      }
      await assertCentered()
      await expect(root.getByRole('heading', { name: 'Skills in perspective.' })).toHaveCSS('opacity', '1')
      await expect(root.locator('.skills-tool-cell')).toHaveCount(25)
      await expect(root.locator('.skills-category')).toHaveCount(4)
      // Every content region participates, including the hero and sculpture.
      if (!profile.reduced && profile.height > 500) {
        const selectors = ['.skills-title', '.skills-hero-description', '.skills-totals strong',
          '.skills-browse-button', '.skills-stack-visual', '.skills-spread-button', '.skills-filter',
          '.skills-index-count', '.skills-section-copy h3', '.skills-section-copy p']
        for (const selector of selectors) {
          const item = root.locator(selector).first()
          await item.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
          await expect(item).toHaveCSS('opacity', '1')
          await item.evaluate(el => {
            const panel = el.closest('.portfolio-overlay-panel')
            const anchor = el.closest('[data-skills-anchor]') || el
            let top = 0
            for (let node = anchor; node && node !== panel; node = node.offsetParent) top += node.offsetTop
            panel.scrollTop = top + anchor.offsetHeight - panel.clientHeight * .21
          })
          // Some hero items start inside this band already, and the footer
          // cannot reach it without scrolling past the end of the document.
          const inBand = await item.evaluate(el => {
            const panel = el.closest('.portfolio-overlay-panel')
            const anchor = el.closest('[data-skills-anchor]') || el
            let top = 0
            for (let node = anchor; node && node !== panel; node = node.offsetParent) top += node.offsetTop
            return top + anchor.offsetHeight > panel.clientHeight * .34
              && Math.abs((top + anchor.offsetHeight - panel.scrollTop) / panel.clientHeight - .21) < .01
          })
          if (inBand) {
            await expect.poll(() => item.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.1)
            await expect.poll(() => item.evaluate(el => Number(getComputedStyle(el).opacity)), { message: `${selector} exits within About's upper band` }).toBeLessThan(.9)
          }
          await item.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
          await expect(item).toHaveCSS('opacity', '1')
          await expect(item).toHaveCSS('transform', 'none')
        }
        await panel.evaluate(el => { el.scrollTop = 0 })
      }
      await panel.screenshot({ path: testInfo.outputPath('intro.png') })
      await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)

      await assertCentered()

      // The visible control changes the actual depth of the sculpture.
      const spread = root.getByRole('button', { name: 'Bring together' })
      await spread.scrollIntoViewIfNeeded()
      const topLayer = root.locator('.skills-stack-layer').first()
      const depth = () => topLayer.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m43)
      await expect.poll(depth).toBeGreaterThan(100)
      await spread.click()
      await expect(root.getByRole('button', { name: 'Spread layers' })).toHaveAttribute('aria-pressed', 'false')
      await expect.poll(depth).toBeLessThanOrEqual(36.1)
      await root.getByRole('button', { name: 'Spread layers' }).click()
      await expect.poll(depth).toBeGreaterThan(100)

      await root.getByRole('button', { name: 'Explore toolkit' }).click()
      await expect(root.getByRole('group', { name: 'Filter skills by discipline' })).toBeInViewport()
      await assertCentered()
      const filters = root.locator('.skills-filter')
      for (const [index, count] of [[1, 9], [2, 4], [3, 3], [4, 9], [0, 25]]) {
        if (index === 2) {
          await page.keyboard.press('Tab')
          await filters.nth(index).focus()
          await expect(filters.nth(index)).toHaveCSS('opacity', '1')
          await expect(filters.nth(index)).toHaveCSS('transform', 'none')
          await page.keyboard.press('Space')
        } else await filters.nth(index).click()
        await expect(filters.nth(index)).toHaveAttribute('aria-pressed', 'true')
        await expect(root.locator('.skills-tool-cell')).toHaveCount(count)
        await expect(root.getByRole('status')).toContainText(`${count} tools`)
        await assertCentered()
      }
      const card = root.locator('.skills-tool-face').first()
      await card.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(card).toHaveCSS('opacity', '1')
      await expect(card).toHaveCSS('transform', 'none')
      await expect(root.locator('.skills-tool-cell').first()).toHaveCSS('transform', 'none')
      await panel.screenshot({ path: testInfo.outputPath('toolkit.png') })

      // Exit near the upper edge, then reverse without losing the tool.
      if (!profile.reduced && profile.height > 500) {
        await card.evaluate(el => {
          const panel = el.closest('.portfolio-overlay-panel')
          panel.scrollTop += el.closest('.skills-tool-cell').getBoundingClientRect().bottom
            - panel.getBoundingClientRect().top - panel.clientHeight * .21
        })
        await expect.poll(() => card.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.05)
        await expect.poll(() => card.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.95)
        await card.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
        await expect(card).toHaveCSS('opacity', '1')
        await expect(card).toHaveCSS('transform', 'none')
      }
      // The lower entry uses the same 96%–84% band as About.
      if (!profile.reduced) {
        const lowerCard = root.locator('.skills-tool-face').nth(9)
        await lowerCard.evaluate(el => {
          const panel = el.closest('.portfolio-overlay-panel')
          const anchor = el.closest('[data-skills-anchor]')
          let top = 0
          for (let node = anchor; node && node !== panel; node = node.offsetParent) top += node.offsetTop
          panel.scrollTop = top - panel.clientHeight * .9
        })
        await expect.poll(() => lowerCard.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.1)
        await expect.poll(() => lowerCard.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.98)
        await lowerCard.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
        await expect(lowerCard).toHaveCSS('opacity', '1')
        await expect(lowerCard).toHaveCSS('transform', 'none')
      }
      // Every tile has real X/Y/depth motion, including compact touch profiles.
      // Use stationary cell geometry; a transformed face must not move its trigger.
      for (let index = 0; index < 25; index++) {
        const tool = root.locator('.skills-tool-face').nth(index)
        const is3D = () => tool.evaluate(el => {
          const style = getComputedStyle(el)
          const matrix = new DOMMatrixReadOnly(style.transform)
          return Number(style.opacity) > .05 && Number(style.opacity) < .99
            && Math.abs(matrix.m23) > .01 && Math.abs(matrix.m13) > .005 && matrix.m43 < -.1
        })
        if (!profile.reduced) {
          const entryReachable = await tool.evaluate(el => {
            const cell = el.closest('.skills-tool-cell')
            const panel = el.closest('.portfolio-overlay-panel')
            let top = 0
            for (let node = cell; node && node !== panel; node = node.offsetParent) top += node.offsetTop
            const max = panel.scrollHeight - panel.clientHeight
            const start = Math.min(max - 1, top - panel.clientHeight * .96)
            const end = Math.max(start + 1, Math.min(max, top - panel.clientHeight * .84))
            const middle = (start + end) / 2
            panel.scrollTop = middle
            return middle >= 0 && middle <= max
          })
          if (entryReachable) {
            await expect.poll(is3D, { message: `tile ${index + 1} enters in 3D` }).toBe(true)
            if (index === 9) await panel.screenshot({ path: testInfo.outputPath('tile-entry.png') })
          }
        }
        await tool.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
        await expect(tool).toHaveCSS('opacity', '1')
        await expect(tool).toHaveCSS('transform', 'none')
        if (!profile.reduced) {
          const exitReachable = await tool.evaluate(el => {
            const cell = el.closest('.skills-tool-cell')
            const panel = el.closest('.portfolio-overlay-panel')
            let top = 0
            for (let node = cell; node && node !== panel; node = node.offsetParent) top += node.offsetTop
            const middle = top + cell.offsetHeight - panel.clientHeight * .21
            panel.scrollTop = middle
            return middle >= 0 && middle <= panel.scrollHeight - panel.clientHeight
          })
          if (exitReachable) {
            await expect.poll(is3D, { message: `tile ${index + 1} exits in 3D` }).toBe(true)
            if (index === 9) await panel.screenshot({ path: testInfo.outputPath('tile-exit.png') })
          }
          await tool.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
          await expect(tool).toHaveCSS('opacity', '1')
          await expect(tool).toHaveCSS('transform', 'none')
        }
      }
      await expect.poll(() => root.locator('.skills-tool-content img').evaluateAll(images =>
        images.every(img => img.complete && img.naturalWidth > 0))).toBe(true)
      await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
      await assertCentered()
      await assertPinnedHeader(page, panel, testInfo)
      await page.getByRole('button', { name: 'Close skills details' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(async () => {
        await page.mouse.move(face.x + 1, face.y)
        await page.mouse.move(face.x, face.y)
        await expect.poll(() => page.locator('.cube-breath canvas').evaluate(canvas => canvas.style.cursor), { timeout: 500 }).toBe('pointer')
      }).toPass({ timeout: 10000 })
      await page.mouse.click(face.x, face.y)
      await expect(page.getByRole('dialog', { name: 'skills details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
      await expect(root.locator('.skills-tool-cell')).toHaveCount(25)
      await expect(root.locator('.skills-title')).toHaveCSS('opacity', '1')
      expect(errors).toEqual([])
    })
  })
}
