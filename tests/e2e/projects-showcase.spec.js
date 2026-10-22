import { expect, test } from '@playwright/test'
import { openProjects } from './helpers/skills.js'

for (const profile of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'phone reduced motion', width: 390, height: 844, touch: true, reduced: true },
]) test.describe(`Project showcase: ${profile.name}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })

  test('switches projects, stays level at rest, and opens the chosen case study', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await openProjects(page, profile)
    const showcase = page.getByRole('region', { name: 'Project showcase' })
    const panel = page.locator('.portfolio-overlay-panel')
    await showcase.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
    const current = showcase.locator('.projects-showcase-position')
    const preview = showcase.locator('.projects-hero-window')
    await expect(current).toHaveText('TIP Airlines / 01 of 05')
    await expect(showcase.locator('.projects-hero-perspective')).toHaveCSS('transform', 'none')
    await expect(preview).toHaveCSS('transform', 'none')
    await expect.poll(() => showcase.locator('.projects-hero-tilt').evaluate(el => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      return Math.abs(matrix.m13) + Math.abs(matrix.m23)
    })).toBe(0)
    await showcase.getByRole('button', { name: 'Previous project', exact: true }).click()
    await expect(current).toHaveText('DinoWeb / 05 of 05')
    await showcase.getByRole('button', { name: 'Next project', exact: true }).click()
    await expect(current).toHaveText('TIP Airlines / 01 of 05')
    for (const title of ['TIP Airlines', 'Pastry Shop Management System', 'Earth Arcade', 'Quarto', 'DinoWeb']) {
      const selector = showcase.getByRole('button', { name: `Show ${title}`, exact: true })
      await selector.click()
      await expect(selector).toHaveAttribute('aria-pressed', 'true')
      await expect(showcase.locator('.projects-hero-window')).toHaveCount(1)
      await expect(showcase.getByRole('img', { name: `${title} application preview` })).toBeVisible()
      await expect.poll(() => showcase.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true)
    }
    await showcase.getByRole('button', { name: 'Show Quarto', exact: true }).focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('ArrowRight')
    await expect(current).toHaveText('DinoWeb / 05 of 05')
    await page.keyboard.press('ArrowLeft')
    await expect(current).toHaveText('Quarto / 04 of 05')
    await expect(preview).toHaveCSS('transform', 'none')

    if (profile.touch) {
      const stage = showcase.locator('.projects-hero-perspective')
      await stage.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(showcase.locator('.projects-hero-art')).toHaveCSS('opacity', '1')
      const box = await stage.boundingBox()
      const session = await page.context().newCDPSession(page)
      const point = { x: box.x + box.width * .8, y: box.y + box.height * .5 }
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] })
      for (let step = 1; step <= 10; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: point.x - 90 * step / 10, y: point.y }] })
        await page.waitForTimeout(20)
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect(current).toHaveText('DinoWeb / 05 of 05')
      await expect(showcase.locator('.projects-hero-tilt')).not.toHaveAttribute('data-touch-active')
    }
    await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
    await page.mouse.move(2, 2)
    await expect(preview).toHaveCSS('transform', 'none')
    await showcase.screenshot({ path: testInfo.outputPath('switchable-showcase.png') })
    const title = profile.touch ? 'DinoWeb' : 'Quarto'
    await showcase.getByRole('button', { name: `View ${title}`, exact: true }).click()
    await expect(page.locator('.project-modal-title')).toHaveText(title)
    await page.getByRole('button', { name: 'Back to projects', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Project showcase' })).toBeVisible()
    expect(errors).toEqual([])
  })
})
