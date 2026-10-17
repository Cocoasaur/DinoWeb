import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

function cubePoint(width, height, local, rx = -20, ry = -45) {
  const layout = getHomeViewportLayout(width, height)
  const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100)
  camera.position.z = 5
  camera.updateMatrixWorld()
  const point = new THREE.Vector3(...local)
    .applyEuler(new THREE.Euler(rx * Math.PI / 180, ry * Math.PI / 180, 0))
    .multiplyScalar(layout.cubeScale)
    .add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  return { x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 }
}

async function openAbout(page, profile) {
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
  const origin = cubePoint(profile.width, profile.height, [0, 0, 0])
  await page.mouse.move(origin.x, origin.y)
  await page.mouse.down()
  await page.mouse.move(origin.x + Math.PI / 4 / .008, origin.y + (110 * Math.PI / 180) / .008, { steps: 30 })
  await page.mouse.up()
  await expect.poll(async () => {
    const coords = (await page.locator('.home-coordinate').textContent()).match(/X:\s*([\d.-]+),?\s*Y:\s*([\d.-]+)/)
    return !!coords && Math.abs(Number(coords[1]) - 90) < 2 && Math.abs(Number(coords[2])) < 2
  }).toBe(true)
  const face = cubePoint(profile.width, profile.height, [0, 1.01, 0], 90, 0)
  await page.mouse.click(face.x, face.y)
  await expect(page.getByRole('dialog', { name: 'about details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
  return face
}

async function fullyRevealed(locator) {
  await expect(locator).toHaveCSS('opacity', '1')
  await expect(locator).toHaveCSS('transform', 'none')
}

async function revealAtCenter(locator) {
  await locator.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }))
  await fullyRevealed(locator)
}

const profiles = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'low-end phone', width: 430, height: 800, touch: true, low: true },
  { name: 'reduced motion', width: 430, height: 800, touch: true, reduced: true },
]

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({
      viewport: { width: profile.width, height: profile.height },
      isMobile: !!profile.touch,
      hasTouch: !!profile.touch,
      reducedMotion: profile.reduced ? 'reduce' : 'no-preference',
      serviceWorkers: 'block',
    })

    test('reveals panel content and preserves filtering, documents, and reopening', async ({ page }, testInfo) => {
      test.setTimeout(90000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(low => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => low ? 2 : 8 })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => low ? 2 : 8 })
      }, !!profile.low)
      await page.route('https://github-contributions-api.jogruber.de/**', route => route.fulfill({
        json: { contributions: [{ date: `${new Date().getFullYear()}-01-01`, level: 2, count: 3 }] },
      }))
      const face = await openAbout(page, profile)
      const root = page.locator('.about-page')
      const panel = page.locator('.portfolio-overlay-panel')
      await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible()
      await fullyRevealed(root.locator('.about-copy').first())
      await fullyRevealed(root.locator('.about-copy').first().locator('.about-copy-word').last())
      if (!profile.reduced) {
        await expect(root.locator('.about-timeline-content').first()).toHaveCSS('opacity', '0')

        // Revisit a card through both edges of the viewport, without remounting.
        const firstCard = root.locator('.about-cert-cell').first()
        await firstCard.scrollIntoViewIfNeeded()
        await fullyRevealed(firstCard)

        // Upward motion must undo a reveal while the card is still on screen,
        // rather than waiting until it has already left the panel.
        const placeCard = async fraction => {
          await firstCard.evaluate((card, fraction) => {
            const scroller = card.closest('.portfolio-overlay-panel')
            scroller.scrollTop += card.getBoundingClientRect().top
              - scroller.getBoundingClientRect().top - scroller.clientHeight * fraction
          }, fraction)
        }
        await placeCard(.83)
        await expect.poll(() => firstCard.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.1)
        await expect.poll(() => firstCard.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.9)
        // Cards in the same row must cascade with scroll, rather than sharing
        // one progress value with time delays that disappear while scrubbing.
        await expect.poll(() => root.locator('.about-cert-cell').evaluateAll(cards =>
          Number(getComputedStyle(cards[0]).opacity) - Number(getComputedStyle(cards[1]).opacity)
        )).toBeGreaterThan(.02)
        await expect(firstCard).toBeInViewport()
        await expect.poll(() => firstCard.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeGreaterThan(0)
        await placeCard(.97)
        await expect.poll(() => firstCard.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.1)
        await placeCard(.68)
        await fullyRevealed(firstCard)
        // The upper exit should lift away, distinct from its lower entrance.
        await firstCard.evaluate(card => {
          const scroller = card.closest('.portfolio-overlay-panel')
          scroller.scrollTop += card.getBoundingClientRect().bottom
            - scroller.getBoundingClientRect().top - scroller.clientHeight * .14
        })
        await expect.poll(() => firstCard.evaluate(el => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.1)
        await expect.poll(() => firstCard.evaluate(el => Number(getComputedStyle(el).opacity))).toBeLessThan(.9)
        await expect.poll(() => firstCard.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).m42)).toBeLessThan(0)
        await revealAtCenter(firstCard)
        await panel.evaluate(el => { el.scrollTop = 0 })
        await expect(firstCard).toHaveCSS('opacity', '0')
        await fullyRevealed(root.locator('.about-copy').first())
        await expect(root.locator('.about-title-char').last()).toHaveCSS('transform', 'none')
        await firstCard.scrollIntoViewIfNeeded()
        await fullyRevealed(firstCard)
        await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
        await expect(firstCard).toHaveCSS('opacity', '0')
        await firstCard.scrollIntoViewIfNeeded()
        await fullyRevealed(firstCard)
      }

      await root.locator('.about-cert-filters').scrollIntoViewIfNeeded()
      await page.getByRole('button', { name: 'AI & Data' }).click()
      await expect(root.locator('.about-cert-cell')).toHaveCount(2)
      const certificate = root.locator('.about-cert-cell').first()
      // Keyboard focus reveals a card immediately, even before its stagger completes.
      await page.keyboard.press('Tab')
      await certificate.focus()
      await fullyRevealed(certificate)
      await page.keyboard.press('Enter')
      await expect(page.locator('.cert-lightbox')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.locator('.cert-lightbox')).toHaveCount(0)
      await page.getByRole('button', { name: 'All', exact: true }).click()
      await expect(root.locator('.about-cert-cell')).toHaveCount(profile.touch ? 6 : 7)
      if (profile.touch) {
        await page.getByRole('button', { name: 'Next page' }).click()
        await expect(root.locator('.about-cert-cell')).toHaveCount(1)
        await root.locator('.about-cert-cell').first().scrollIntoViewIfNeeded()
        await fullyRevealed(root.locator('.about-cert-cell').first())
      }

      await root.locator('.about-cv-viewer').scrollIntoViewIfNeeded()
      const resume = page.getByRole('tab', { name: 'Résumé', exact: true })
      await expect(resume).toBeVisible({ timeout: 15000 })
      await resume.click()
      await expect(root.locator('.about-cv-page-wrap').first()).toHaveAttribute('aria-busy', 'false', { timeout: 15000 })
      await fullyRevealed(root.locator('.about-document-reveal').first())

      await revealAtCenter(root.locator('.about-cv-toolbar-actions'))
      await revealAtCenter(root.locator('.about-cv-download'))
      const contributionYear = page.getByRole('button', { name: 'Select contribution year' })
      await contributionYear.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await fullyRevealed(root.locator('.about-contributions-header'))
      await contributionYear.click()
      await expect(page.getByRole('listbox', { name: 'Contribution years' })).toBeVisible()
      await page.keyboard.press('Escape')

      await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
      const education = root.locator('.about-timeline-content')
      for (const item of await education.all()) await revealAtCenter(item)
      await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
      await fullyRevealed(root.locator('.about-parameter-row').last())
      if (!profile.reduced) {
        await expect.poll(() => root.locator('.about-scroll-progress-fill').evaluate(el =>
          new DOMMatrixReadOnly(getComputedStyle(el).transform).a)).toBeGreaterThan(.98)
      }
      expect(await panel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1)
      await testInfo.attach(`about-${profile.name}`, { body: await panel.screenshot(), contentType: 'image/png' })

      if (!profile.reduced) {
        await panel.evaluate(el => { el.scrollTop = 0 })
        await expect(education.first()).toHaveCSS('opacity', '0')
        await expect(root.locator('.about-parameter-row').last()).toHaveCSS('opacity', '0')
        await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
        for (const item of await education.all()) await revealAtCenter(item)
        await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
        await fullyRevealed(root.locator('.about-parameter-row').last())
      }

      // Changing the OS preference must revert existing animations immediately.
      if (!profile.reduced) {
        await page.emulateMedia({ reducedMotion: 'reduce' })
        await expect(root.locator('.about-scroll-progress')).toBeHidden()
        await fullyRevealed(root.locator('.about-timeline-content').last())
        await expect(root.locator('.about-profile-parallax')).toHaveCSS('transform', 'none')
        await page.emulateMedia({ reducedMotion: 'no-preference' })
      }
      await page.getByRole('button', { name: 'Close about details' }).click()
      await expect(root).toHaveCount(0, { timeout: 10000 })
      await expect(page.locator('.cube-entrance')).toHaveAttribute('data-render-paused', 'false')
      await expect(page.locator('.cube-entrance > div')).toHaveCSS('filter', 'blur(0px)')
      // Wait for the worker to acknowledge the face is pickable again, rather
      // than assuming the camera is ready as soon as the CSS dissolve finishes.
      await page.mouse.move(face.x, face.y)
      await expect(page.locator('.cube-breath canvas')).toHaveCSS('cursor', 'pointer')
      await page.mouse.click(face.x, face.y)
      await expect(page.getByRole('dialog', { name: 'about details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
      await expect(root).toBeVisible({ timeout: 15000 })
      await expect(panel).toHaveJSProperty('scrollTop', 0)
      await fullyRevealed(root.locator('.about-copy').first())
      expect(errors).toEqual([])
    })
  })
}
