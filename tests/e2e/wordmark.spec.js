import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const profiles = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 430, height: 800, touch: true },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'low-end phone', width: 430, height: 800, touch: true, low: true },
  { name: 'medium desktop', width: 1440, height: 900, medium: true },
  { name: 'blue desktop', width: 1440, height: 900, dark: true },
  { name: 'blue phone', width: 430, height: 800, touch: true, dark: true },
  { name: 'phone fallback', width: 430, height: 800, touch: true, fallback: true },
  { name: 'reduced motion', width: 430, height: 800, touch: true, reduced: true },
]

async function facePoint(page, name) {
  const { width, height, rect } = await page.locator('.cube-entrance canvas').evaluate(el => ({
    width: el.clientWidth, height: el.clientHeight,
    rect: { x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y,
      width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height },
  }))
  const layout = getHomeViewportLayout(width, height)
  const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100)
  camera.position.z = 5; camera.updateMatrixWorld()
  const face = FACE_CONFIG.find(face => face.name === name)
  // Tap inside the face, away from the two hit-plane triangles' shared seam.
  const point = new THREE.Vector3(.15, 0, .006)
    .applyEuler(new THREE.Euler(...face.rotation)).add(new THREE.Vector3(...face.position))
    .applyEuler(new THREE.Euler(-20 * Math.PI / 180, -45 * Math.PI / 180, 0))
    .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  return { x: rect.x + (point.x + 1) * rect.width / 2, y: rect.y + (1 - point.y) * rect.height / 2 }
}

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch, hasTouch: !!profile.touch,
      reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })
    test('draws only on startup or refresh, never on cube clicks or theme changes', async ({ page }, testInfo) => {
      test.setTimeout(90000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(profile => {
        if (window.top !== window || location.protocol !== 'http:') return
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : profile.medium ? 4 : 8 })
        Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
        if (profile.dark) localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu')
        if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
        window.__wordmarkStarts = []
        document.addEventListener('animationstart', event => {
          if (event.animationName === 'brand-outline-draw') window.__wordmarkStarts.push(performance.now())
        }, true)
        window.__wordmarkFrames = []
        const sample = () => {
          const stage = document.querySelector('.portfolio-viewport')
          const svg = [...document.querySelectorAll('.brand-wordmark')].find(el => el.querySelector('.web-trace') && el.getBoundingClientRect().width > 0)
          if (svg) {
            const traces = [...svg.querySelectorAll('.web-trace')]
            window.__wordmarkFrames.push({ time: performance.now(), active: stage?.classList.contains('stage-active'),
              theme: document.documentElement.dataset.theme, transitioning: document.documentElement.classList.contains('theme-transitioning'),
              offsets: traces.map(el => parseFloat(getComputedStyle(el).strokeDashoffset)),
              states: traces.flatMap(el => el.getAnimations().map(animation => animation.playState)),
              durations: traces.map(el => getComputedStyle(el).animationDuration) })
          }
          window.__wordmarkFrame = requestAnimationFrame(sample)
        }
        requestAnimationFrame(sample)
      }, profile)
      await page.goto('./')
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      const svg = page.locator(profile.touch ? '.mobile-branding__web' : '.sidebar-home__logo')
      await expect(svg).toBeVisible()
      await expect(svg.locator('.web-trace')).toHaveCount(3)
      await expect(svg.locator('path[fill*="hatch"]')).toHaveCount(3)
      await expect(page.locator('.mobile-branding__dino .web-trace')).toHaveCount(0)
      await expect.poll(() => svg.locator('.web-trace').evaluateAll(els => els.every(el => parseFloat(getComputedStyle(el).strokeDashoffset) === 0))).toBe(true)
      const initial = await page.evaluate(() => window.__wordmarkFrames.filter(frame => frame.active))
      expect(initial.length).toBeGreaterThan(0)
      if (profile.reduced) {
        expect(initial.every(frame => frame.offsets.every(offset => offset === 0))).toBe(true)
        expect(initial.every(frame => frame.states.length === 0)).toBe(true)
      } else {
        expect(initial.some(frame => frame.offsets.some(offset => offset > .05 && offset < .95))).toBe(true)
        expect(initial.at(-1).offsets).toEqual([0, 0, 0])
        expect(initial.some(frame => frame.durations.every(duration => duration === (profile.low || profile.medium ? '0.36s' : '0.5s')))).toBe(true)
        const finite = await svg.locator('.web-trace').evaluateAll(els => els.flatMap(el => el.getAnimations().map(animation => animation.effect.getTiming().iterations)))
        expect(finite.every(iterations => iterations === 1)).toBe(true)
      }
      await svg.screenshot({ path: testInfo.outputPath('settled-wordmark.png') })
      await page.waitForTimeout(300)
      // The SVG must stop animating; the independently moving grid behind it
      // means screenshot bytes cannot establish whether the contours settled.
      expect(await svg.locator('.web-trace').evaluateAll(els => els.every(el =>
        parseFloat(getComputedStyle(el).strokeDashoffset) === 0 &&
        el.getAnimations().every(animation => animation.playState === 'finished')))).toBe(true)
      const afterStartup = await svg.evaluate(el => {
        window.__settledAt = performance.now()
        window.__wordmarkNodes = [...el.querySelectorAll('.web-trace')]
        return window.__wordmarkStarts.length
      })
      // Genuine cube input toggles the React theme without recreating SVG nodes.
      await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
      const clickFace = async name => {
        const point = await facePoint(page, name)
        if (profile.touch) await page.touchscreen.tap(point.x, point.y)
        else await page.mouse.click(point.x, point.y)
      }
      await clickFace('theme')
      await expect(page.locator('html')).toHaveAttribute('data-theme', profile.dark ? 'clair-obscur' : 'demain-soir-bleu', { timeout: 10000 })
      await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/, { timeout: 10000 })
      await expect.poll(() => svg.locator('.web-trace').evaluateAll(els => els.every(el => parseFloat(getComputedStyle(el).strokeDashoffset) === 0))).toBe(true)
      await expect(svg.locator('.web-trace').first()).toHaveCSS('stroke', profile.dark ? 'rgb(10, 10, 10)' : 'rgb(255, 255, 255)')
      await expect(svg.locator('.web-trace')).toHaveCount(3)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      for (let visit = 0; visit < 2; visit++) {
        // Opening and closing a cube page used to restart the trace on each
        // parent state update, even without changing the theme.
        await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
        await clickFace('projects')
        await expect(page.getByRole('dialog')).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
        await page.getByRole('button', { name: 'Close projects', exact: true }).click()
        await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10000 })
        await expect.poll(() => page.locator('.cube-entrance > div').evaluate(el => getComputedStyle(el).filter)).toBe('blur(0px)')
      }
      expect(await svg.evaluate(el => [...el.querySelectorAll('.web-trace')].every((path, i) => path === window.__wordmarkNodes[i]))).toBe(true)
      expect(await page.evaluate(() => window.__wordmarkStarts.length)).toBe(afterStartup)
      const timeline = await page.evaluate(() => { cancelAnimationFrame(window.__wordmarkFrame); return window.__wordmarkFrames })
      const settledAt = await page.evaluate(() => window.__settledAt)
      const interactions = timeline.filter(frame => frame.time >= settledAt)
      expect(interactions.length).toBeGreaterThan(0)
      expect(interactions.every(frame => frame.offsets.every(offset => offset === 0))).toBe(true)
      await testInfo.attach('wordmark timeline', { body: JSON.stringify(timeline), contentType: 'application/json' })
      // A real refresh should create a fresh intro, with reduced motion honored.
      await page.reload()
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      await expect.poll(() => svg.locator('.web-trace').evaluateAll(els => els.every(el => parseFloat(getComputedStyle(el).strokeDashoffset) === 0))).toBe(true)
      const refreshed = await page.evaluate(() => window.__wordmarkFrames.filter(frame => frame.active))
      expect(refreshed.length).toBeGreaterThan(0)
      if (profile.reduced) expect(refreshed.every(frame => frame.offsets.every(offset => offset === 0))).toBe(true)
      else expect(refreshed.some(frame => frame.offsets.some(offset => offset > .05 && offset < .95))).toBe(true)
      await page.evaluate(() => cancelAnimationFrame(window.__wordmarkFrame))
      expect(errors).toEqual([])
    })
  })
}
