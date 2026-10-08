import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { getCubeTransition } from '../../src/utils/cubeTransition.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const profiles = [
  { name: 'desktop worker', width: 1440, height: 900 },
  { name: 'phone worker', width: 430, height: 800, touch: true },
  { name: 'desktop fallback', width: 1440, height: 900, fallback: true },
  { name: 'phone fallback', width: 430, height: 800, touch: true, fallback: true },
  { name: 'low-end phone', width: 430, height: 800, touch: true, low: true },
  { name: 'reduced motion', width: 430, height: 800, touch: true, reduced: true },
]

function facePoint(profile) {
  const layout = getHomeViewportLayout(profile.width, profile.height)
  const camera = new THREE.PerspectiveCamera(45, profile.width / profile.height, .1, 100)
  camera.position.z = 5
  camera.updateMatrixWorld()
  const point = new THREE.Vector3(1.01, 0, 0)
    .applyEuler(new THREE.Euler(-20 * Math.PI / 180, -45 * Math.PI / 180, 0))
    .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  return { x: (point.x + 1) * profile.width / 2, y: (1 - point.y) * profile.height / 2 }
}

async function trace(page) {
  await page.evaluate(() => {
    window.__transitionFrames = []
    window.__transitionTraceFrame = 0
    const sample = () => {
      const stage = document.querySelector('.cube-entrance')
      const blur = document.querySelector('.cube-entrance > div')
      const overlay = document.querySelector('[role="dialog"]')
      const filter = blur && getComputedStyle(blur).filter
      window.__transitionFrames.push({
        time: performance.now(), phase: overlay?.dataset.phase || 'hidden',
        opacity: overlay ? Number(getComputedStyle(overlay).opacity) : 0,
        paused: stage?.dataset.renderPaused === 'true',
        blur: Number(filter?.match(/blur\(([\d.]+)px\)/)?.[1] || 0),
      })
      window.__transitionTraceFrame = requestAnimationFrame(sample)
    }
    sample()
  })
}

async function history(page) {
  return page.evaluate(() => {
    cancelAnimationFrame(window.__transitionTraceFrame)
    return window.__transitionFrames
  })
}

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({
      viewport: { width: profile.width, height: profile.height },
      isMobile: !!profile.touch, hasTouch: !!profile.touch, deviceScaleFactor: 1,
      reducedMotion: profile.reduced ? 'reduce' : 'no-preference',
      serviceWorkers: 'block',
    })
    test('overlaps the dissolve and camera, preserves blur, and returns cleanly', async ({ page }, testInfo) => {
      test.setTimeout(90000)
      const transition = getCubeTransition(!!profile.touch || !!profile.low, !!profile.reduced)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(profile => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: false, effectiveType: '4g' }) })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
        if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      }, profile)
      await page.goto('./')
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
      const stage = page.locator('.cube-entrance')
      const dialog = page.getByRole('dialog')
      if (profile.fallback) await expect(stage).not.toHaveAttribute('data-renderer', 'worker')
      else await expect(stage).toHaveAttribute('data-renderer', 'worker')
      const face = facePoint(profile)
      const clickFace = () => page.mouse.click(face.x, face.y)
      await trace(page)
      await clickFace()
      await expect(dialog).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
      await expect(stage).toHaveAttribute('data-render-paused', 'true')
      await page.waitForFunction(() => window.__transitionFrames.some(frame => frame.phase !== 'hidden' && frame.paused))
      const frames = await history(page)
      const fading = frames.find(frame => frame.phase === 'fading-in')
      const endpoint = frames.find(frame => frame.time >= fading?.time && frame.paused)
      expect(fading).toBeTruthy()
      expect(endpoint).toBeTruthy()
      if (!profile.reduced) {
        expect(fading.paused).toBe(false)
        const lead = endpoint.time - fading.time
        expect(lead).toBeGreaterThan(transition.zoomInMs - transition.fadeStartMs - 180)
        expect(lead).toBeLessThan(transition.zoomInMs - transition.fadeStartMs + 180)
        const overlapping = frames.filter(frame => frame.phase === 'fading-in' && !frame.paused)
        expect(overlapping.some(frame => frame.opacity > 0 && frame.opacity < 1)).toBe(true)
        expect(Math.max(...overlapping.map(frame => frame.blur))).toBeGreaterThanOrEqual(fading.blur)
        const maxBlur = transition.blurPx
        expect(endpoint.blur).toBeCloseTo(maxBlur, 0)
      } else {
        expect(endpoint.blur).toBe(0)
      }
      await testInfo.attach('opening timeline', { body: JSON.stringify(frames), contentType: 'application/json' })
      // Closing must keep the blurred face still until the page disappears.
      await trace(page)
      await page.getByRole('button', { name: 'Close projects', exact: true }).click()
      await expect(dialog).toHaveCount(0, { timeout: 10000 })
      await expect(stage).toHaveAttribute('data-render-paused', 'false')
      await expect.poll(() => page.locator('.cube-entrance > div').evaluate(el => getComputedStyle(el).filter)).toBe('blur(0px)')
      const closed = await history(page)
      const outgoing = closed.filter(frame => frame.phase === 'fading-out')
      expect(outgoing.length).toBeGreaterThan(0)
      expect(outgoing.every(frame => frame.paused)).toBe(true)
      if (!profile.reduced) expect(outgoing.every(frame => frame.blur >= transition.blurPx - .1)).toBe(true)
      // Repeat visits reset the lead signal; early close must not re-open the page.
      await trace(page)
      await clickFace()
      await expect(dialog).toHaveAttribute('data-phase', profile.reduced ? 'open' : 'fading-in', { timeout: 15000 })
      if (!profile.reduced) await page.waitForFunction(() => window.__transitionFrames.some(frame => frame.phase === 'fading-in'))
      await dialog.getByRole('button', { name: 'Close projects', exact: true }).evaluate(el => el.click())
      await expect(dialog).toHaveCount(0, { timeout: 10000 })
      await expect.poll(() => page.locator('.cube-entrance > div').evaluate(el => getComputedStyle(el).filter)).toBe('blur(0px)')
      await expect(stage).toHaveAttribute('data-render-paused', 'false')
      await expect.poll(() => page.locator('.home-coordinate').textContent()).toMatch(/X: -20\.00, Y: -45\.00/)
      const earlyClosed = await history(page)
      if (!profile.reduced) {
        const beforeClose = earlyClosed.filter(frame => frame.phase === 'fading-in').at(-1)
        const firstClose = earlyClosed.find(frame => frame.phase === 'fading-out')
        expect(beforeClose).toBeTruthy()
        expect(firstClose).toBeTruthy()
        // The blur keeps progressing across close. Account for skipped frames,
        // while rejecting a snap to maximum blur (the easing peaks below 3x).
        const duration = transition.blurInMs
        const maxBlur = transition.blurPx
        const allowedProgress = 3 * maxBlur * (firstClose.time - beforeClose.time) / duration + .5
        expect(firstClose.blur - beforeClose.blur).toBeLessThan(allowedProgress)
      }
      expect(errors).toEqual([])
    })
  })
}
