import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const profiles = [
  { name: 'desktop worker', width: 1440, height: 900 },
  { name: 'phone worker', width: 430, height: 800, touch: true },
  { name: 'tablet worker', width: 820, height: 1180, touch: true },
  { name: 'low-end phone', width: 430, height: 800, touch: true, low: true },
  { name: 'phone fallback', width: 430, height: 800, touch: true, fallback: true },
  { name: 'desktop fallback', width: 1440, height: 900, fallback: true },
  { name: 'blue theme phone', width: 430, height: 800, touch: true, dark: true },
  { name: 'blue theme fallback', width: 430, height: 800, touch: true, dark: true, fallback: true },
  { name: 'reduced motion phone', width: 430, height: 800, touch: true, reduced: true },
]

async function facePoints(page, name) {
  const canvas = page.locator('.cube-entrance canvas')
  const { width, height, rect } = await canvas.evaluate(el => ({ width: el.clientWidth, height: el.clientHeight,
    rect: { x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height } }))
  const layout = getHomeViewportLayout(width, height)
  const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100)
  camera.position.z = 5; camera.updateMatrixWorld()
  const face = FACE_CONFIG.find(face => face.name === name)
  const project = (x, y, scale = 1) => {
    const point = new THREE.Vector3(x * scale, y * scale, .006)
      .applyEuler(new THREE.Euler(...face.rotation)).add(new THREE.Vector3(...face.position))
      .applyEuler(new THREE.Euler(-20 * Math.PI / 180, -45 * Math.PI / 180, 0))
      .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
    return { x: rect.x + (point.x + 1) * rect.width / 2, y: rect.y + (1 - point.y) * rect.height / 2 }
  }
  const bars = scale => [[-1.025,1.025,1,-1],[1.025,1.025,-1,-1],[-1.025,-1.025,1,1],[1.025,-1.025,-1,1]].map(([x,y,h,v]) =>
    Array.from({ length: 10 }, (_, i) => [project(x + h * (i + .5) / 100, y, scale), project(x, y + v * (i + .5) / 100, scale)]).flat())
  return { center: project(0, 0), idle: bars(1), highlighted: bars(1.05) }
}

async function markerPixels(page, shot, bars, dark) {
  return page.evaluate(async ({ shot, bars, dark }) => {
    const img = new Image(); img.src = `data:image/png;base64,${shot}`; await img.decode()
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0)
    const data = ctx.getImageData(0, 0, img.width, img.height).data
    return bars.map(points => points.filter(point => {
      for (let y = Math.round(point.y) - 1; y <= Math.round(point.y) + 1; y++) for (let x = Math.round(point.x) - 1; x <= Math.round(point.x) + 1; x++) {
        if (x < 0 || y < 0 || x >= img.width || y >= img.height) continue
        const offset = (y * img.width + x) * 4
        const brightness = (data[offset] + data[offset + 1] + data[offset + 2]) / 3
        if (dark ? brightness > 145 : brightness < 130) return true
      }
      return false
    }).length)
  }, { shot: shot.toString('base64'), bars, dark })
}

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch, hasTouch: !!profile.touch,
      deviceScaleFactor: 2, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })
    test('keeps face markers visible, highlights on hold, and sleeps after cancel', async ({ page, context }, testInfo) => {
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(profile => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: false, effectiveType: '4g' }) })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
        if (profile.dark) localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu')
        if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
        window.__glDraws = 0
        for (const name of ['drawArrays', 'drawElements']) {
          const native = WebGL2RenderingContext.prototype[name]
          WebGL2RenderingContext.prototype[name] = function (...args) { window.__glDraws++; return native.apply(this, args) }
        }
      }, profile)
      await page.goto('./')
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
      const session = await context.newCDPSession(page)
      const touch = (type, point) => session.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [{ ...point, id: 0, radiusX: 1, radiusY: 1 }] : [] })
      // Inspect both the logo face and a labeled face so markers cannot regress
      // behind a text-only or reduced-effects branch.
      for (const name of ['home', 'projects']) {
        const points = await facePoints(page, name)
        const before = await page.screenshot({ scale: 'css' })
        const initial = await markerPixels(page, before, points.idle, profile.dark)
        expect(initial.filter(count => count >= 8).length).toBeGreaterThanOrEqual(2)
        if (profile.touch) await touch('touchStart', points.center)
        else { await page.mouse.move(points.center.x, points.center.y); await page.mouse.down() }
        await page.waitForTimeout(1200)
        const held = await page.screenshot({ scale: 'css' })
        const moved = await markerPixels(page, held, profile.reduced ? points.idle : points.highlighted, profile.dark)
        expect(moved.filter(count => count >= 8).length).toBeGreaterThanOrEqual(2)
        if (!profile.reduced) {
          const originalAtNew = await markerPixels(page, before, points.highlighted, profile.dark)
          expect(moved.reduce((sum, n, i) => sum + Math.max(0, n - originalAtNew[i]), 0)).toBeGreaterThan(6)
        }
        await testInfo.attach(`${name} held markers`, { body: held, contentType: 'image/png' })
        await expect(page.getByRole('dialog')).toHaveCount(0)
        const draws = () => page.evaluate(() => Number(document.querySelector('[data-scene-draws]')?.dataset.sceneDraws || window.__glDraws))
        await expect.poll(async () => { const before = await draws(); await page.waitForTimeout(250); return await draws() === before }, { timeout: 6000 }).toBe(true)
        if (profile.touch) await touch('touchCancel')
        else {
          const canvas = page.locator('.cube-entrance canvas')
          await canvas.dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', clientX: points.center.x, clientY: points.center.y })
          await canvas.dispatchEvent('mouseup')
          await page.mouse.move(0, 0)
          await page.mouse.up()
          // Center the camera parallax before comparing the original face pose.
          await canvas.dispatchEvent('pointermove', { pointerId: 1, pointerType: 'mouse', clientX: profile.width / 2, clientY: profile.height / 2 })
          await canvas.dispatchEvent('pointerleave', { pointerId: 1, pointerType: 'mouse' })
        }
        await page.waitForTimeout(profile.reduced ? 100 : 1300)
        await expect(page.getByRole('dialog')).toHaveCount(0)
        const reset = await page.screenshot({ scale: 'css' })
        const resetMarkers = await markerPixels(page, reset, points.idle, profile.dark)
        expect(resetMarkers.filter(count => count >= 8).length).toBeGreaterThanOrEqual(2)
      }
      expect(errors).toEqual([])
    })
  })
}
