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
  { name: 'blue theme', width: 1440, height: 900, dark: true },
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
      if (profile.dark) await page.addInitScript(() => localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu'))
      await page.route('https://github-contributions-api.jogruber.de/**', route => route.fulfill({
        json: { contributions: [{ date: `${new Date().getFullYear()}-01-01`, level: 2, count: 3 }] },
      }))
      const face = await openAbout(page, profile)
      const root = page.locator('.about-page')
      const panel = page.locator('.portfolio-overlay-panel')
      await expect(page.getByRole('heading', { name: 'About', exact: true })).toBeVisible()
      await fullyRevealed(root.locator('.about-copy').first())
      await fullyRevealed(root.locator('.about-copy').first().locator('.about-copy-word').last())
      // Shared rules stay in place while the content inside their cells moves.
      await expect(root.locator('.about-grid')).toHaveCSS('transform', 'none')
      const columns = await root.locator('.about-grid').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)
      expect(columns).toBe(profile.touch ? 1 : 2)
      await expect(root.locator('.about-title-accent')).toHaveCSS('transform', 'none')
      if (!profile.touch) await fullyRevealed(root.locator('.about-profile-wrap'))
      const introPath = testInfo.outputPath('intro.png')
      await panel.screenshot({ path: introPath })
      if (!profile.touch) {
        await expect(panel).toHaveAttribute('data-scrollbars', 'custom')
        const id = await panel.getAttribute('id')
        const bar = page.locator(`[role="scrollbar"][aria-controls="${id}"][aria-orientation="vertical"]`)
        await expect(bar).toBeVisible()
        const thumb = await bar.locator('span').boundingBox()
        await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2)
        await page.mouse.down()
        await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2 + 50, { steps: 8 })
        await expect(page.locator('.portfolio-cursor')).toHaveAttribute('data-visible', 'true')
        expect(await panel.evaluate(el => el.scrollTop)).toBeGreaterThan(100)
        await page.mouse.up()
        await panel.evaluate(el => { el.scrollTop = 0 })
      }
      await testInfo.attach(`about-${profile.name}-intro`, {
        path: introPath,
        contentType: 'image/png',
      })
      if (!profile.reduced) {
        await expect(root.locator('.about-timeline-content').first()).toHaveCSS('opacity', '0')

        // Revisit a card through both edges of the viewport, without remounting.
        const firstCard = root.locator('.about-cert-cell').first()
        await firstCard.scrollIntoViewIfNeeded()
        await fullyRevealed(firstCard)
        await expect(root.locator('.about-cert-frame').first()).toHaveCSS('transform', 'none')
        await expect.poll(() => root.locator('.about-cert-cell img').evaluateAll(images =>
          images.slice(0, 3).every(img => img.complete && img.naturalWidth > 0)
        )).toBe(true)
        await panel.screenshot({ path: testInfo.outputPath('certificates.png') })

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
      if (!profile.touch) {
        await certificate.hover()
        await expect(page.locator('.portfolio-cursor__label')).toHaveText('VIEW')
        await expect(page.locator('html')).toHaveAttribute('data-custom-cursor', 'active')
        await page.screenshot({ path: testInfo.outputPath('cursor-certificate.png') })
      }
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
        // Pagination must bring the shorter result page into view itself.
        await expect(root.locator('.about-cert-frame').first()).toBeInViewport({ ratio: 1 })
        await fullyRevealed(root.locator('.about-cert-cell').first())
        await panel.screenshot({ path: testInfo.outputPath('pagination-next.png') })
        await page.getByRole('button', { name: 'Previous page' }).click()
        await expect(root.locator('.about-cert-cell')).toHaveCount(6)
        await expect(root.locator('.about-cert-frame').first()).toBeInViewport({ ratio: 1 })
        await page.getByRole('button', { name: 'Page 2', exact: true }).click()
        await expect(root.locator('.about-cert-cell')).toHaveCount(1)
        await expect(root.locator('.about-cert-frame').first()).toBeInViewport({ ratio: 1 })
        await fullyRevealed(root.locator('.about-cert-cell').first())
      }

      await root.locator('.about-cv-viewer').scrollIntoViewIfNeeded()
      const resume = page.getByRole('tab', { name: 'Résumé', exact: true })
      await expect(resume).toBeVisible({ timeout: 15000 })
      await resume.click()
      await expect(root.locator('.about-cv-page-wrap').first()).toHaveAttribute('aria-busy', 'false', { timeout: 15000 })
      await fullyRevealed(root.locator('.about-document-reveal').first())

      // Sample both reveal bands: short toolbar rows must never lose their
      // labels/buttons underneath the opaque PDF scrollport while animating.
      const toolbar = root.locator('.about-cv-toolbar')
      for (const fraction of [.92, .82, .68, .24, .12]) {
        await toolbar.evaluate((el, fraction) => {
          const panel = el.closest('.portfolio-overlay-panel')
          panel.scrollTop += el.getBoundingClientRect().top
            - panel.getBoundingClientRect().top - panel.clientHeight * fraction
        }, fraction)
        await page.waitForTimeout(80)
        const overflow = await toolbar.evaluate(el => {
          const row = el.getBoundingClientRect()
          return Math.max(...[...el.querySelectorAll('.about-cv-toolbar-label, .about-cv-toolbar-actions')].map(child => {
            const box = child.getBoundingClientRect()
            return Math.max(row.top - box.top, box.bottom - row.bottom)
          }))
        })
        expect(overflow).toBeLessThanOrEqual(.5)
      }

      await revealAtCenter(root.locator('.about-cv-toolbar-actions'))
      await revealAtCenter(root.locator('.about-cv-download'))
      if (!profile.touch) {
        const viewer = root.locator('.about-cv-scroll')
        await expect(viewer).toHaveAttribute('data-scrollbars', 'custom')
        const id = await viewer.getAttribute('id')
        const bar = page.locator(`[role="scrollbar"][aria-controls="${id}"][aria-orientation="vertical"]`)
        await viewer.evaluate(el => {
          const panel = el.closest('.portfolio-overlay-panel')
          panel.scrollTop += el.getBoundingClientRect().top - panel.getBoundingClientRect().top - 100
        })
        await expect(bar).toBeVisible()
        // The portaled rail follows the outer scroll on the next frame.
        await expect.poll(() => bar.evaluate(el => {
          const viewer = document.getElementById(el.getAttribute('aria-controls'))
          return Math.abs(el.getBoundingClientRect().top - viewer.getBoundingClientRect().top - viewer.clientTop)
        })).toBeLessThan(1)
        const thumb = await bar.locator('span').boundingBox()
        // The bottom of a tall PDF viewer can be clipped by the outer panel.
        const y = Math.min(thumb.y + thumb.height / 2, 600)
        await page.mouse.move(thumb.x + thumb.width / 2, y)
        await expect(page.locator('.portfolio-cursor__label')).toHaveText('SCROLL')
        await page.mouse.down()
        await page.mouse.move(thumb.x + thumb.width / 2, y + 40, { steps: 8 })
        await expect(page.locator('.portfolio-cursor')).toHaveAttribute('data-visible', 'true')
        await expect.poll(() => viewer.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
        await page.mouse.up()
      }
      const contributionYear = page.getByRole('button', { name: 'Select contribution year' })
      await contributionYear.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await fullyRevealed(root.locator('.about-contributions-header'))
      await contributionYear.click()
      await expect(page.getByRole('listbox', { name: 'Contribution years' })).toBeVisible()
      await page.keyboard.press('Escape')

      await fullyRevealed(root.locator('.about-contributions-body'))
      const calendar = root.locator('.about-contributions-grid')
      await expect.poll(() => calendar.locator('.about-contributions-day').count()).toBeGreaterThan(350)
      const cells = await calendar.evaluate(grid => {
        const cell = (column, row) => [...grid.querySelectorAll('.about-contributions-day')].find(el =>
          Number.parseInt(el.style.gridColumn) === column && Number.parseInt(el.style.gridRow) === row
        ).getBoundingClientRect()
        const a = cell(3, 3), right = cell(4, 3), below = cell(3, 4)
        return { width: a.width, height: a.height, gapX: right.left - a.right, gapY: below.top - a.bottom }
      })
      expect(Math.abs(cells.width - cells.height)).toBeLessThan(.2)
      expect(Math.abs(cells.gapX - cells.gapY)).toBeLessThan(.2)
      expect(cells.gapX).toBeCloseTo(3, 0)
      await panel.screenshot({ path: testInfo.outputPath('contributions-grid.png') })

      await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
      const education = root.locator('.about-timeline-content')
      for (const item of await education.all()) await revealAtCenter(item)
      await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
      await fullyRevealed(root.locator('.about-parameter-row').last())
      await expect(page.getByRole('button', { name: 'Close about details' })).toBeInViewport()
      if (!profile.reduced) {
        await expect.poll(() => root.locator('.about-scroll-progress-fill').evaluate(el =>
          new DOMMatrixReadOnly(getComputedStyle(el).transform).a)).toBeGreaterThan(.98)
      }
      const horizontal = await panel.evaluate(panel => {
        const edge = panel.getBoundingClientRect().right
        const outside = [...panel.querySelectorAll('*')].filter(el => {
          if (el.getBoundingClientRect().right <= edge + 1) return false
          for (let parent = el.parentElement; parent && parent !== panel; parent = parent.parentElement) {
            if (/auto|scroll|hidden|clip/.test(getComputedStyle(parent).overflowX)) return false
          }
          return true
        }).map(el => ({ className: el.className, right: el.getBoundingClientRect().right, transform: getComputedStyle(el).transform }))
        return { width: panel.scrollWidth - panel.clientWidth, outside }
      })
      expect(horizontal.width, JSON.stringify(horizontal.outside)).toBeLessThanOrEqual(1)
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
      await expect(page.locator('[role="scrollbar"]')).toHaveCount(0)
      await expect(page.locator('.cube-entrance')).toHaveAttribute('data-render-paused', 'false')
      await expect(page.locator('.cube-entrance > div')).toHaveCSS('filter', 'blur(0px)')
      // Wait for the worker to acknowledge the face is pickable again, rather
      // than assuming the camera is ready as soon as the CSS dissolve finishes.
      // The first pointer move can reach the worker before it resumes picking.
      // Keep sending a real hover until the worker acknowledges the face.
      await expect(async () => {
        await page.mouse.move(face.x + 1, face.y)
        await page.mouse.move(face.x, face.y)
        await expect.poll(() => page.locator('.cube-breath canvas').evaluate(canvas => canvas.style.cursor), { timeout: 500 }).toBe('pointer')
      }).toPass({ timeout: 10000 })
      await page.mouse.click(face.x, face.y)
      await expect(page.getByRole('dialog', { name: 'about details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
      await expect(root).toBeVisible({ timeout: 15000 })
      await expect(panel).toHaveJSProperty('scrollTop', 0)
      await fullyRevealed(root.locator('.about-copy').first())
      expect(errors).toEqual([])
    })
  })
}

test.describe('first-load progress', () => {
  test.use({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })
  test('keeps its direction while lazy content loads and the scroll range changes', async ({ page }) => {
    test.setTimeout(60000)
    let releaseDocument
    let documentRequested = false
    const held = new Promise(resolve => { releaseDocument = resolve })
    await page.route('**/CvViewer*', async route => {
      documentRequested = true
      await held
      await route.continue()
    })
    await page.route('https://github-contributions-api.jogruber.de/**', route => route.fulfill({
      json: { contributions: [{ date: `${new Date().getFullYear()}-01-01`, level: 2, count: 3 }] },
    }))
    const progress = () => page.locator('.about-scroll-progress-fill').evaluate(el =>
      new DOMMatrixReadOnly(getComputedStyle(el).transform).a)
    try {
      await openAbout(page, { width: 1440, height: 900 })
      const panel = page.locator('.portfolio-overlay-panel')
      await page.locator('.about-cv-viewer').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }))
      await expect.poll(() => documentRequested).toBe(true)
      await expect.poll(progress).toBeGreaterThan(.05)
      const before = await progress()
      releaseDocument()
      await expect(page.locator('.about-cv-scroll')).toBeVisible()
      await page.waitForTimeout(350)
      expect(await progress()).toBeGreaterThanOrEqual(before - .002)

      for (const direction of [1, -1]) {
        const samples = await panel.evaluate(async (panel, direction) => {
          const root = panel.querySelector('.about-page')
          const extra = document.createElement('div')
          root.appendChild(extra)
          const read = () => new DOMMatrixReadOnly(getComputedStyle(root.querySelector('.about-scroll-progress-fill')).transform).a
          const samples = [read()]
          for (let i = 0; i < 12; i++) {
            if (i === 3) extra.style.height = '320px'
            if (i === 7) extra.style.height = '0px'
            panel.scrollTop += direction * 24
            await new Promise(requestAnimationFrame)
            await new Promise(requestAnimationFrame)
            samples.push(read())
          }
          extra.remove()
          return samples
        }, direction)
        for (let i = 1; i < samples.length; i++) {
          expect((samples[i] - samples[i - 1]) * direction).toBeGreaterThanOrEqual(-.002)
        }
      }
      await panel.evaluate(el => { el.scrollTop = 0 })
      await expect.poll(progress).toBeLessThan(.001)
      await panel.evaluate(el => { el.scrollTop = el.scrollHeight })
      await expect.poll(progress).toBeGreaterThan(.999)
    } finally { releaseDocument() }
  })
})
