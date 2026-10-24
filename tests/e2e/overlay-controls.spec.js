import { expect, test } from '@playwright/test'
import { openAbout, openSkills, openProjects, openContacts } from './helpers/skills.js'

for (const profile of [
  { name: 'desktop blue', width: 1440, height: 900, dark: true },
  { name: 'phone light', width: 390, height: 844, touch: true },
]) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, serviceWorkers: 'block' })
  for (const [name, open] of [['about', openAbout], ['skills', openSkills], ['projects', openProjects], ['contacts', openContacts]]) {
    test(`${name} keeps a complete close highlight above the scrollport`, async ({ page }, testInfo) => {
      test.setTimeout(90000)
      await page.addInitScript(dark => localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur'), !!profile.dark)
      await open(page, profile)
      const frame = page.locator('.portfolio-overlay-frame')
      const panel = frame.locator('.portfolio-overlay-panel')
      const close = frame.locator('.portfolio-overlay-close')
      const top = (await close.boundingBox()).y
      await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
      await expect.poll(async () => Math.abs((await close.boundingBox()).y - top)).toBeLessThan(1)
      if (profile.touch) await close.focus()
      else { await page.locator('body').click({ position: { x: 1, y: 1 } }); await close.hover() }
      await expect.poll(() => close.evaluate(el => {
        const rim = getComputedStyle(el, '::after')
        const sides = ['Top', 'Right', 'Bottom', 'Left']
        return sides.every(side => rim[`border${side}Width`] === '1px'
          && rim[`border${side}Style`] === 'solid'
          && rim[`border${side}Color`] !== 'rgba(0, 0, 0, 0)')
      })).toBe(true)
      expect(await close.evaluate(el => {
        const box = el.getBoundingClientRect()
        return [[2, 2], [box.width - 2, 2], [2, box.height - 2], [box.width - 2, box.height - 2]].every(([x, y]) => el.contains(document.elementFromPoint(box.x + x, box.y + y)))
      })).toBe(true)
      await close.screenshot({ path: testInfo.outputPath('close-highlight.png') })

      if (name === 'skills') {
        await expect(page.getByRole('navigation', { name: 'Revisit a skill discipline' })).toHaveCount(0)
        const filters = page.getByRole('group', { name: 'Filter skills by discipline' })
        await filters.scrollIntoViewIfNeeded()
        const backend = filters.getByRole('button', { name: /Backend/ })
        if (profile.touch) await backend.tap(); else await backend.click()
        await expect(page.locator('.skills-filter[aria-pressed="true"]')).toContainText('Backend')
        await expect(page.locator('.skills-tool-cell')).toHaveCount(4)
        await expect(page.getByRole('group', { name: 'Filter skills by discipline' })).toBeInViewport()
      }
      if (name === 'projects') {
        await expect(page.getByRole('navigation', { name: 'Projects by name' })).toHaveCount(0)
        const quarto = page.getByRole('button', { name: 'Open Quarto project', exact: true })
        await quarto.scrollIntoViewIfNeeded()
        await expect(page.locator('.projects-card-face').filter({ has: quarto })).toHaveCSS('opacity', '1')
        if (profile.touch) await quarto.tap(); else await quarto.click()
        await expect(page.locator('.project-modal-title')).toHaveText('Quarto')
        await expect(page.getByRole('button', { name: 'Back to projects', exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Back to projects', exact: true }).click()
        await expect(quarto).toBeVisible()
      }
      await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
      await close.click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
    })
  }
})
