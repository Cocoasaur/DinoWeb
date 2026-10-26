import { expect, test } from '@playwright/test'
import { openContacts } from './helpers/skills.js'

for (const profile of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'tablet blue', width: 820, height: 1180, touch: true, dark: true },
]) test.describe(`Contact scroll motion: ${profile.name}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, serviceWorkers: 'block' })

  test('reveals individual content, reverses at both viewport edges, and preserves the pinned header', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(dark => localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur'), !!profile.dark)
    await openContacts(page, profile)
    const root = page.locator('.contacts-page')
    const panel = page.locator('.portfolio-overlay-panel[data-page="contacts"]')
    const frame = page.locator('.portfolio-overlay-frame[data-page="contacts"]')
    const header = frame.locator('.portfolio-overlay-masthead')
    const headerBox = await header.boundingBox()
    const panelBox = await panel.boundingBox()
    expect(Math.abs(headerBox.y + headerBox.height - panelBox.y)).toBeLessThan(1)

    // Independent parts of the letter, rather than one animation for the sheet.
    for (const selector of ['.contact-introduction h2', '.contact-recipient', '.contact-email-link',
      '.contact-direct-copy', '.contact-copy', '.contact-desk-caption span', '.contact-availability dd',
      '.contact-socials a', '.contact-signoff p', '.contact-signoff span']) {
      const item = root.locator(selector).first()
      await item.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      const surface = item.locator('xpath=ancestor-or-self::*[@data-contact-reveal][1]')
      await expect(surface).toHaveCSS('opacity', '1')
      await expect(surface).toHaveCSS('transform', 'none')
    }
    const setEdge = (surface, edge, fraction) => surface.evaluate((el, { edge, fraction }) => {
      const panel = el.closest('.portfolio-overlay-panel')
      const anchor = el.closest('[data-contact-anchor]')
      let top = 0
      for (let node = anchor; node && node !== panel; node = node.offsetParent) top += node.offsetTop
      panel.scrollTop = top + (edge === 'bottom' ? anchor.offsetHeight : 0) - panel.clientHeight * fraction
      return (top + (edge === 'bottom' ? anchor.offsetHeight : 0) - panel.scrollTop) / panel.clientHeight
    }, { edge, fraction })
    const opacity = surface => surface.evaluate(el => Number(getComputedStyle(el).opacity))
    const letterCopy = root.locator('.contact-letter-top .contact-kicker').locator('..')
    for (const fraction of [.34, .21, .08, .21, .4]) {
      expect(await setEdge(letterCopy, 'bottom', fraction)).toBeCloseTo(fraction, 2)
      if (fraction === .21) {
        await expect.poll(() => opacity(letterCopy)).toBeGreaterThan(.1)
        await expect.poll(() => opacity(letterCopy)).toBeLessThan(.9)
        await frame.screenshot({ path: testInfo.outputPath('upper-exit.png') })
      } else if (fraction === .08) await expect.poll(() => opacity(letterCopy)).toBeLessThan(.01)
      else await expect.poll(() => opacity(letterCopy)).toBeGreaterThan(.99)
    }
    const social = root.locator('.contact-socials [data-contact-reveal]').first()
    for (const fraction of [.97, .90, .84, .90, .97]) {
      expect(await setEdge(social, 'top', fraction)).toBeCloseTo(fraction, 2)
      if (fraction === .90) {
        await expect.poll(() => opacity(social)).toBeGreaterThan(.1)
        await expect.poll(() => opacity(social)).toBeLessThan(.9)
      } else if (fraction === .97) await expect.poll(() => opacity(social)).toBeLessThan(.01)
      else await expect.poll(() => opacity(social)).toBeGreaterThan(.99)
    }
    await panel.evaluate(el => { el.scrollTop = 0 })
    await expect(root.locator('.contact-introduction [data-contact-reveal]').nth(1)).toHaveCSS('opacity', '1')
    expect(await header.boundingBox()).toEqual(headerBox)
    await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
    await frame.screenshot({ path: testInfo.outputPath('contact-scroll-intro.png') })
    await page.getByRole('button', { name: 'Close contacts details' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
