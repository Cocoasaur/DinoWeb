import { expect, test } from '@playwright/test'
import { openProjects } from './helpers/skills.js'

const profiles = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'blue theme', width: 1440, height: 900, dark: true },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'portrait monitor', width: 900, height: 1440 },
  { name: 'small phone', width: 320, height: 700, touch: true },
  { name: 'landscape phone', width: 844, height: 390, touch: true },
  { name: 'reduced motion', width: 430, height: 800, touch: true, reduced: true },
]

async function center(locator) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
}

for (const profile of profiles) test.describe(`Projects: ${profile.name}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch,
    hasTouch: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })

  test('supports reversible 3D cards, filtering, project details and navigation', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(dark => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
      localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur')
    }, !!profile.dark)
    const projectFace = await openProjects(page, profile)
    const root = page.locator('.projects-page')
    const panel = page.locator('.portfolio-overlay-panel[data-page="projects"]')
    const frame = page.locator('.portfolio-overlay-frame[data-page="projects"]')
    await expect(root.locator('.projects-card')).toHaveCount(5)
    await expect(root.locator('.projects-title').locator('..')).toHaveCSS('opacity', '1')
    await page.mouse.move(2, 2)
    await frame.screenshot({ path: testInfo.outputPath('projects-hero.png') })
    await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
    await root.getByRole('button', { name: 'Explore work' }).click()
    const filters = root.getByRole('group', { name: 'Filter projects by discipline' })
    await expect(filters).toBeInViewport()
    for (const [name, count] of [['Web', 2], ['Desktop', 2], ['Games', 1], ['All work', 5]]) {
      const filter = filters.getByRole('button', { name: new RegExp(`^${name}`) })
      if (name === 'Desktop') { await filter.focus(); await page.keyboard.press('Space') }
      else await filter.click()
      await expect(filter).toHaveAttribute('aria-pressed', 'true')
      await expect(root.locator('.projects-card')).toHaveCount(count)
    }
    const search = root.getByRole('searchbox', { name: 'Search projects' })
    await search.fill('Python')
    await expect(root.locator('.projects-card')).toHaveCount(2)
    await search.fill('Front-End')
    await expect(root.locator('.projects-card')).toHaveCount(1)
    await expect(root.locator('.projects-card')).toContainText('Pastry Shop')
    await search.fill('In_Progress')
    await expect(root.locator('.projects-card')).toHaveCount(1)
    await expect(root.locator('.projects-card')).toContainText('DinoWeb')
    await search.fill('nothing-matches-this')
    await expect(root.locator('.projects-card')).toHaveCount(0)
    await root.getByRole('button', { name: 'Reset filters' }).click()
    await expect(search).toHaveValue('')
    await expect(root.locator('.projects-card')).toHaveCount(5)

    for (let index = 0; index < 5; index++) {
      const face = root.locator('.projects-card-face').nth(index)
      await center(face)
      await expect(face).toHaveCSS('opacity', '1')
      await expect(face).toHaveCSS('transform', 'none')
      if (!profile.reduced) {
        for (const phase of ['entry', 'exit']) {
          const reachable = await face.evaluate((el, phase) => {
            const panel = el.closest('.portfolio-overlay-panel')
            const anchor = el.closest('[data-projects-anchor]')
            let top = 0
            for (let node = anchor; node && node !== panel; node = node.offsetParent) top += node.offsetTop
            const position = phase === 'entry' ? top - panel.clientHeight * .9 : top + anchor.offsetHeight - panel.clientHeight * .21
            const max = panel.scrollHeight - panel.clientHeight
            if (position < 0 || position > max) return false
            panel.scrollTop = position
            return true
          }, phase)
          if (reachable) {
            await expect.poll(() => face.evaluate(el => {
              const style = getComputedStyle(el)
              const m = new DOMMatrixReadOnly(style.transform)
              return Number(style.opacity) > .05 && Number(style.opacity) < .99 && Math.abs(m.m23) > .005 && Math.abs(m.m13) > .002 && m.m43 < -.1
            }), { message: `${phase} should have real depth and X/Y rotation` }).toBe(true)
            if (index === 2) await frame.screenshot({ path: testInfo.outputPath(`project-${phase}.png`) })
          }
          await center(face)
          await expect(face).toHaveCSS('opacity', '1')
          await expect(face).toHaveCSS('transform', 'none')
        }
      }
      await expect.poll(() => face.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true)
    }
    const card = root.locator('.projects-card').first()
    await center(card)
    await expect(root.locator('.projects-card-face').first()).toHaveCSS('transform', 'none')
    // Record the activation position after browser focus/actionability scrolling.
    await card.evaluate(el => el.addEventListener('click', () => {
      const panel = el.closest('.portfolio-overlay-panel')
      panel.dataset.projectsTestScroll = String(panel.scrollTop)
    }, { once: true, capture: true }))
    await card.click()
    const listPosition = Number(await panel.getAttribute('data-projects-test-scroll'))
    await expect(root.locator('.project-modal-title')).toHaveText('TIP Airlines')
    await expect(page.getByRole('button', { name: 'Back to projects' })).toBeVisible()
    await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBe(0)
    const gallery = root.locator('.project-modal-carousel')
    await center(gallery)
    await expect(root.locator('.project-gallery-surface')).toHaveCSS('opacity', '1')
    await gallery.getByRole('button', { name: 'Next screenshot' }).click()
    await expect(gallery.locator('.image-carousel__counter')).toContainText('02')
    await gallery.locator('.image-carousel__viewport').click()
    await expect(page.locator('.project-lightbox')).toBeVisible()
    await page.getByRole('button', { name: 'Close screenshot viewer' }).click()
    await expect(page.locator('.project-lightbox')).toHaveCount(0)
    const note = root.locator('.project-private-note')
    await center(note)
    await expect(note).toContainText('private')
    await expect(root.getByRole('link', { name: 'View repository on GitHub' })).toHaveCount(0)
    await expect.poll(() => panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
    await frame.screenshot({ path: testInfo.outputPath('project-details.png') })
    await page.getByRole('button', { name: 'Back to projects' }).click()
    await expect(root.locator('.projects-card')).toHaveCount(5)
    await expect.poll(() => panel.evaluate((el, position) => Math.abs(el.scrollTop - position), listPosition)).toBeLessThan(2)
    const quarto = root.getByRole('button', { name: 'Open Quarto project' })
    await center(quarto)
    await quarto.click()
    await expect(root.getByRole('link', { name: 'Visit live project' })).toHaveAttribute('href', 'https://quarto-4d613.web.app')
    await page.getByRole('button', { name: 'Back to projects' }).click()
    for (const fraction of [0, .5, 1]) {
      await panel.evaluate((el, ratio) => { el.scrollTop = (el.scrollHeight - el.clientHeight) * ratio }, fraction)
      const header = await frame.locator('.portfolio-overlay-masthead').boundingBox()
      const close = await page.getByRole('button', { name: 'Close projects', exact: true }).boundingBox()
      const body = await panel.boundingBox()
      expect(Math.abs(header.y + header.height - body.y)).toBeLessThan(1)
      expect(Math.abs(close.y - header.y)).toBeLessThan(1)
    }
    await page.getByRole('button', { name: 'Close projects', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(async () => {
      await page.mouse.move(projectFace.x + 1, projectFace.y)
      await page.mouse.move(projectFace.x, projectFace.y)
      await expect.poll(() => page.locator('.cube-breath canvas').evaluate(el => el.style.cursor), { timeout: 500 }).toBe('pointer')
    }).toPass({ timeout: 10000 })
    await page.mouse.click(projectFace.x, projectFace.y)
    await expect(page.getByRole('dialog', { name: 'projects details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
    await expect(root.locator('.projects-card')).toHaveCount(5)
    expect(errors).toEqual([])
  })
})

for (const touchProfile of [{ name: 'phone', width: 430, height: 850 }, { name: 'blue tablet', width: 820, height: 1180, dark: true }, { name: 'reduced', width: 430, height: 850, reduced: true }]) test.describe(`Projects native touch ${touchProfile.name}`, () => {
  const reduced = !!touchProfile.reduced
  test.use({ viewport: { width: touchProfile.width, height: touchProfile.height }, hasTouch: true, isMobile: true, reducedMotion: reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })
  test('tilts on finger input without trapping pan or opening a card after a drag', async ({ page }) => {
    test.setTimeout(60000)
    await page.addInitScript(dark => localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur'), !!touchProfile.dark)
    await openProjects(page, touchProfile)
    const panel = page.locator('.portfolio-overlay-panel')
    const session = await page.context().newCDPSession(page)
    const touch = (type, points = []) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points })
    const tilt = page.locator('.projects-card-tilt').first()
    await center(tilt)
    await expect(page.locator('.projects-card-face').first()).toHaveCSS('opacity', '1')
    let box = await tilt.boundingBox()
    let point = { x: box.x + box.width * .55, y: box.y + box.height * .55 }
    await touch('touchStart', [point])
    await expect(tilt).toHaveAttribute('data-touch-active', 'true')
    if (reduced) await expect(tilt).toHaveCSS('transform', 'none')
    else await expect.poll(() => tilt.evaluate(el => Math.abs(new DOMMatrixReadOnly(getComputedStyle(el).transform).m23))).toBeGreaterThan(.002)
    await touch('touchCancel')
    await expect(tilt).not.toHaveAttribute('data-touch-active')
    const before = await panel.evaluate(el => el.scrollTop)
    await touch('touchStart', [point])
    for (let step = 1; step <= 10; step++) {
      await touch('touchMove', [{ x: point.x, y: point.y - 130 * step / 10 }])
      await page.waitForTimeout(20) // A real finger pan spans multiple browser frames.
    }
    await touch('touchEnd')
    await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBeGreaterThan(before + 10)
    // Finish native inertia before testing a separate tap (including reduced motion).
    await expect.poll(async () => {
      const previous = await panel.evaluate(el => el.scrollTop)
      await page.waitForTimeout(100)
      return Math.abs(await panel.evaluate(el => el.scrollTop) - previous)
    }).toBeLessThan(1)
    const card = page.locator('.projects-card').first()
    await center(card)
    await expect(page.locator('.projects-card-face').first()).toHaveCSS('opacity', '1')
    const cardTilt = page.locator('.projects-card-tilt').first()
    box = await card.boundingBox()
    point = { x: box.x + box.width * .6, y: box.y + box.height * .45 }
    await touch('touchStart', [point])
    await expect(cardTilt).toHaveAttribute('data-touch-active', 'true')
    await expect(card.locator('img')).toHaveCSS('filter', 'none')
    for (let step = 1; step <= 8; step++) await touch('touchMove', [{ x: point.x - 55 * step / 8, y: point.y }])
    await touch('touchEnd')
    await expect(page.locator('.project-modal')).toHaveCount(0)
    await expect(cardTilt).not.toHaveAttribute('data-touch-active')
    await card.tap()
    await expect(page.locator('.project-modal')).toBeVisible()
    const tool = page.locator('.project-tool-tilt').first()
    await center(tool)
    await expect(tool.locator('..')).toHaveCSS('opacity', '1')
    await expect(tool.locator('..')).toHaveCSS('transform', 'none')
    const toolIcon = tool.locator('img')
    const idleFilter = touchProfile.dark ? 'brightness(0) invert(1)' : 'grayscale(1)'
    await expect(toolIcon).toHaveCSS('filter', idleFilter)
    box = await tool.boundingBox()
    point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    await touch('touchStart', [point])
    await expect(tool).toHaveAttribute('data-touch-active', 'true')
    await expect(toolIcon).toHaveCSS('filter', 'none')
    await touch('touchEnd')
    await expect(tool).not.toHaveAttribute('data-touch-active')
    await expect(toolIcon).toHaveCSS('filter', idleFilter)
    await page.getByRole('button', { name: 'Back to projects' }).tap()
    await page.getByRole('button', { name: 'Close projects', exact: true }).tap()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await session.detach()
  })
})


test('Projects retains search and discipline on return and keeps public project links', async ({ page }) => {
  test.setTimeout(45000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await openProjects(page, { width: 1440, height: 900 })
  const root = page.locator('.projects-page')
  await root.getByRole('button', { name: 'Explore work' }).click()
  const web = root.getByRole('group', { name: 'Filter projects by discipline' }).getByRole('button', { name: /^Web/ })
  await web.click()
  const search = root.getByRole('searchbox', { name: 'Search projects' })
  await search.fill('DinoWeb')
  await expect(root.locator('.projects-card')).toHaveCount(1)
  const card = root.getByRole('button', { name: 'Open DinoWeb project' })
  await card.focus()
  await page.keyboard.press('Enter')
  await expect(root.locator('.project-modal-title')).toHaveText('DinoWeb')
  const repository = root.getByRole('link', { name: 'View repository on GitHub' })
  await center(repository)
  await expect(repository).toBeVisible()
  await expect(repository).toHaveAttribute('href', 'https://github.com/Cocoasaur/DinoWeb.git')
  await expect(root.getByRole('link', { name: 'Visit live project' })).toHaveAttribute('href', 'https://cocoasaur.github.io/DinoWeb/')
  await page.getByRole('button', { name: 'Back to projects' }).click()
  await expect(search).toHaveValue('DinoWeb')
  await expect(web).toHaveAttribute('aria-pressed', 'true')
  await expect(root.locator('.projects-card')).toHaveCount(1)
  await root.getByRole('button', { name: 'Clear project search' }).click()
  await expect(root.locator('.projects-card')).toHaveCount(2)
})
