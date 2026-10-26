import { expect, test } from '@playwright/test'
import { openAbout, openSkills, openProjects, openContacts } from './helpers/skills.js'

for (const profile of [
  { name: 'About desktop', page: 'about', width: 1440, height: 900 },
  { name: 'Skills desktop blue', page: 'skills', width: 1440, height: 900, dark: true },
  { name: 'Projects desktop', page: 'projects', width: 1440, height: 900 },
  { name: 'Contact phone blue', page: 'contacts', width: 390, height: 844, touch: true, dark: true },
  { name: 'Projects phone fallback', page: 'projects', width: 430, height: 800, touch: true, fallback: true },
  { name: 'Contact reduced tablet', page: 'contacts', width: 820, height: 1180, touch: true, reduced: true },
]) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })

  test('keeps one sharp ground painted while opening, scrolling and closing a page', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(profile => {
      localStorage.setItem('dinoweb-theme-v2', profile.dark ? 'demain-soir-bleu' : 'clair-obscur')
      if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      window.groundFrames = []
      const sample = () => {
        const floor = document.querySelector('.home-stage-backdrop > .home-stage-backdrop__floor')
        if (floor && !document.querySelector('.boot-screen')) {
          window.originalGround ??= floor
          let opacity = 1, sharp = true
          for (let node = floor; node instanceof Element; node = node.parentElement) {
            const style = getComputedStyle(node)
            opacity *= Number(style.opacity)
            if (style.filter !== 'none' && style.filter !== 'blur(0px)') sharp = false
          }
          window.groundFrames.push({ phase: document.querySelector('[role="dialog"]')?.dataset.phase || 'home',
            same: floor === window.originalGround && floor.isConnected, opacity, sharp,
            homeRendered: [...document.querySelectorAll('.home-sidebar-wipe, .home-chrome')]
              .every(el => getComputedStyle(el).visibility === 'visible' && Number(getComputedStyle(el).opacity) === 1) })
        }
        window.groundTrace = requestAnimationFrame(sample)
      }
      requestAnimationFrame(sample)
    }, profile)
    const open = { about: openAbout, skills: openSkills, projects: openProjects, contacts: openContacts }[profile.page]
    await open(page, profile)
    const floor = page.locator('.home-stage-backdrop > .home-stage-backdrop__floor')
    await expect(floor).toHaveCount(1)
    const snapshot = () => floor.evaluate(el => ({ transform: getComputedStyle(el).transform,
      drift: getComputedStyle(el, '::before').transform, animation: getComputedStyle(el, '::before').animationPlayState }))
    const before = await snapshot()
    if (!profile.reduced) {
      expect(before.animation).toBe('running')
      await expect(page.locator('.void-grid-drift')).toHaveCSS('animation-play-state', 'running')
    }
    const wallBefore = await page.locator('.void-grid-drift').evaluate(el => getComputedStyle(el).transform)
    await page.mouse.move(2, 2)
    await page.locator('.portfolio-overlay-panel').evaluate(el => { el.scrollTop = el.scrollHeight * .5 })
    await page.waitForTimeout(250)
    const after = await snapshot()
    expect(after.transform, 'panel gestures do not move the ground plane').toBe(before.transform)
    if (!profile.reduced) {
      expect(after.drift, 'ground tiles keep drifting behind the page').not.toBe(before.drift)
      expect(await page.locator('.void-grid-drift').evaluate(el => getComputedStyle(el).transform),
        'wall tiles keep drifting behind the page').not.toBe(wallBefore)
      // Background tabs still sleep, then resume the same animation instances.
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await expect(page.locator('.void-grid-drift')).toHaveCSS('animation-play-state', 'paused')
      expect((await snapshot()).animation).toBe('paused')
      await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
        document.dispatchEvent(new Event('visibilitychange'))
      })
      await expect(page.locator('.void-grid-drift')).toHaveCSS('animation-play-state', 'running')
      expect((await snapshot()).animation).toBe('running')
    } else {
      expect(await floor.evaluate(el => getComputedStyle(el, '::before').animationName)).toBe('none')
      expect(after.drift).toBe(before.drift)
    }
    await page.screenshot({ path: testInfo.outputPath('persistent-page-background.png') })

    // Below the opaque panel, real floor pixels must remain visible. Merely
    // retaining an invisible DOM node under a full-screen cover is insufficient.
    const png = await page.screenshot({ scale: 'css', clip: { x: 0, y: Math.floor(profile.height * .94),
      width: profile.width, height: Math.floor(profile.height * .05) } })
    const ink = await page.evaluate(async ({ png, dark }) => {
      const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
      const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
      const pixels = ctx.getImageData(0, 0, image.width, image.height).data
      const base = dark ? [0,36,81] : [242,242,242]
      let ink = 0
      for (let i = 0; i < pixels.length; i += 4) if (base.some((channel, index) => Math.abs(channel - pixels[i + index]) > 2)) ink++
      return ink
    }, { png: png.toString('base64'), dark: !!profile.dark })
    expect(ink, 'perspective floor remains visible outside the page panel').toBeGreaterThan(40)
    const close = page.getByRole('button', { name: profile.page === 'projects' ? 'Close projects' : `Close ${profile.page} details`, exact: true })
    await close.click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-home-motion-paused', 'false')
    const frames = await page.evaluate(() => { cancelAnimationFrame(window.groundTrace); return window.groundFrames })
    expect(frames.some(frame => frame.phase === 'open')).toBe(true)
    expect(frames.filter(frame => ['fading-in', 'open'].includes(frame.phase)).every(frame => frame.homeRendered),
      'homepage UI remains rendered behind the camera').toBe(true)
    expect(frames.every(frame => frame.same && frame.sharp && frame.opacity === 1)).toBe(true)
    expect(errors).toEqual([])
  })
})
