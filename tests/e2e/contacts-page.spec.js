import { expect, test } from '@playwright/test'
import { openContacts } from './helpers/skills.js'

for (const profile of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'blue theme', width: 1440, height: 900, dark: true },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'small phone', width: 320, height: 700, touch: true },
  { name: 'reduced tablet', width: 820, height: 1180, touch: true, reduced: true },
]) test.describe(`Contact desk: ${profile.name}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })
  test('offers static links and copying with usable controls while scrolling', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(dark => {
      localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur')
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copiedAddress = value } } })
    }, !!profile.dark)
    await openContacts(page, profile)
    const panel = page.locator('.portfolio-overlay-panel[data-page="contacts"]')
    const frame = page.locator('.portfolio-overlay-frame[data-page="contacts"]')
    const root = page.locator('.contacts-page')
    const progress = root.locator('.contact-scroll-progress')
    const progressFill = root.locator('.contact-scroll-progress-fill')
    const letter = root.locator('.contact-letter-anchor > div')
    await expect(root.getByRole('heading', { level: 2 })).toHaveText('Have somethingin mind?')
    await expect(root.locator('.contact-introduction [data-contact-reveal]').first()).toHaveCSS('opacity', '1')
    await page.mouse.move(2, 2)
    await frame.screenshot({ path: testInfo.outputPath('contact-intro.png') })
    await expect(root.locator('input, textarea, form, fieldset')).toHaveCount(0)
    await expect(root.getByRole('link', { name: 'Open email app', exact: true })).toHaveCount(0)
    const email = root.getByRole('link', { name: 'cocoasaurjl@gmail.com', exact: true })
    await expect(email).toHaveAttribute('href', 'mailto:cocoasaurjl@gmail.com')
    await email.focus()
    await expect(letter).toHaveCSS('opacity', '1')
    await expect(letter).toHaveCSS('transform', 'none')
    await expect(email).toHaveCSS('user-select', 'text')
    await frame.screenshot({ path: testInfo.outputPath('contact-letter.png') })
    const copy = root.getByRole('button', { name: 'Copy email address', exact: true })
    await expect(copy).toHaveCount(1)
    if (profile.touch) await copy.tap()
    else await copy.click()
    await expect(root.getByRole('status')).toHaveText('Email address copied.')
    expect(await page.evaluate(() => window.copiedAddress)).toBe('cocoasaurjl@gmail.com')
    await page.evaluate(() => {
      navigator.clipboard.writeText = async () => { throw new Error('Clipboard denied') }
      document.execCommand = () => false
    })
    await copy.click()
    await expect(root.getByRole('status')).toContainText('Couldn’t copy.')
    await expect(copy).toBeFocused()
    // Use keyboard modality to check focused controls without snapping pointer taps.
    await page.keyboard.press('Tab')
    for (const [title, href] of [['GitHub', 'https://github.com/Cocoasaur'], ['LinkedIn', 'https://linkedin.com/in/dinoweb'], ['Stack Overflow', 'https://stackoverflow.com/users/24706411/jlkoko']]) {
      const link = root.getByRole('link', { name: new RegExp(title) })
      await link.focus()
      await expect(link).toHaveAttribute('href', href)
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(link.locator('..')).toHaveCSS('opacity', '1')
    }
    if (profile.touch) {
      await page.evaluate(() => document.activeElement.blur())
      await panel.evaluate(el => { el.scrollTop = 200 })
      await expect.poll(async () => {
        const before = await panel.evaluate(el => el.scrollTop)
        await page.waitForTimeout(100)
        return Math.abs(await panel.evaluate(el => el.scrollTop) - before)
      }).toBeLessThan(1)
      const session = await page.context().newCDPSession(page)
      const box = await panel.boundingBox()
      const start = { x: box.x + 8, y: box.y + box.height * .75 }
      const before = await panel.evaluate(el => el.scrollTop)
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] })
      for (let step = 1; step <= 10; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start.x, y: start.y - step * 12 }] })
        await page.waitForTimeout(20)
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
      await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBeGreaterThan(before + 10)
      await session.detach()
    }
    await page.evaluate(() => document.activeElement.blur())
    for (const fraction of [0, .5, 1]) {
      await panel.evaluate((el, fraction) => { el.scrollTop = (el.scrollHeight - el.clientHeight) * fraction }, fraction)
      const header = await frame.locator('.portfolio-overlay-masthead').boundingBox()
      const close = await page.getByRole('button', { name: 'Close contacts details' }).boundingBox()
      const body = await panel.boundingBox()
      expect(Math.abs(header.y + header.height - body.y)).toBeLessThan(1)
      expect(Math.abs(close.y - header.y)).toBeLessThan(1)
      const progressBox = await progress.boundingBox()
      expect(Math.abs(progressBox.y - body.y)).toBeLessThan(1)
      expect(progressBox.height).toBe(2)
      await expect.poll(async () => {
        const scale = await progressFill.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)
        const ratio = await panel.evaluate(el => el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight))
        return Math.abs(scale - ratio)
      }).toBeLessThan(.01)
      await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
    }
    await panel.evaluate(el => { el.scrollTop = 0 })
    await expect(root.locator('.contact-introduction [data-contact-reveal]').first()).toHaveCSS('opacity', '1')
    await page.getByRole('button', { name: 'Close contacts details' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    expect(errors).toEqual([])
  })
})
