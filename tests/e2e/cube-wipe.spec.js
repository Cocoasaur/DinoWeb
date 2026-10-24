import { expectedPixelEvents, expectedPixelState, installPixelProbe, seekPixels } from './helpers/pixel-probe.js'
import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const profiles = [
  { name: 'desktop worker', width: 1440, height: 900 },
  { name: 'phone worker', width: 430, height: 800, mobile: true },
  { name: 'low-end phone', width: 430, height: 800, mobile: true, low: true },
  { name: 'desktop fallback', width: 1440, height: 900, fallback: true },
  { name: 'phone fallback', width: 430, height: 800, mobile: true, fallback: true },
  { name: 'throttled low-end fallback', width: 430, height: 800, mobile: true, fallback: true, low: true, throttle: true },
]

async function points(page) {
  const info = await page.locator('.cube-entrance canvas').evaluate(canvas => ({
    width: canvas.clientWidth, height: canvas.clientHeight,
    rect: { x: canvas.getBoundingClientRect().x, y: canvas.getBoundingClientRect().y,
      width: canvas.getBoundingClientRect().width, height: canvas.getBoundingClientRect().height },
    center: getComputedStyle(document.querySelector('.cube-breath')).transformOrigin.split(' ').map(Number.parseFloat),
    rotation: document.querySelector('.home-coordinate').textContent.match(/X: ([\d.-]+), Y: ([\d.-]+)/).slice(1).map(Number),
  }))
  const layout = getHomeViewportLayout(info.width, info.height)
  const camera = new THREE.PerspectiveCamera(45, info.width / info.height, .1, 100)
  camera.position.z = 5
  const focal = info.height / (2 * Math.tan(Math.PI / 8))
  // Worker breathing pivots publish the actual rendered center, including
  // camera parallax. The fallback pivot is its settled layout center.
  camera.position.x = layout.restingX - (info.center[0] - info.width / 2) * 5 / focal
  camera.position.y = layout.restingY - (info.height / 2 - info.center[1]) * 5 / focal
  camera.updateMatrixWorld()
  const rotation = new THREE.Euler(...info.rotation.map(n => n * Math.PI / 180), 0)
  const project = (name, x, y) => {
    const face = FACE_CONFIG.find(f => f.name === name)
    const p = new THREE.Vector3(x, y, .006).applyEuler(new THREE.Euler(...face.rotation))
      .add(new THREE.Vector3(...face.position)).applyEuler(rotation).multiplyScalar(layout.cubeScale)
      .add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
    return { x: info.rect.x + (p.x + 1) / 2 * info.rect.width, y: info.rect.y + (1 - p.y) / 2 * info.rect.height }
  }
  return { click: project('theme', .15, 0), body: [[-.25, .35], [.25, .35], [-.25, -.35], [.25, -.35]].map(([x,y]) => project('projects', x, y)) }
}

async function pixels(page, points) {
  const png = (await page.screenshot({ scale: 'css' })).toString('base64')
  return page.evaluate(async ({ png, points }) => {
    const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    return points.map(p => Array.from(ctx.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data).slice(0, 3))
  }, { png, points })
}

for (const profile of profiles) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.mobile,
    hasTouch: !!profile.mobile, serviceWorkers: 'block' })
  test('shows both cube palettes on opposite sides of the actual wipe in both directions', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
    if (profile.throttle) {
      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    }
    await installPixelProbe(page)
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
      if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      window.addEventListener('theme-wipe-start', e => {
        const animation = e.detail.animation
        animation.pause(); animation.currentTime = 1; window.__wipeAnimation = animation
      })
    }, profile)
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(a => a.pause()))
    if (profile.fallback) await expect(page.locator('.cube-entrance')).not.toHaveAttribute('data-renderer', 'worker')
    else await expect(page.locator('.cube-entrance')).toHaveAttribute('data-renderer', 'worker')
    for (const theme of ['demain-soir-bleu', 'clair-obscur']) {
      const { click } = await points(page)
      if (profile.mobile) await page.touchscreen.tap(click.x, click.y)
      else await page.mouse.click(click.x, click.y)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.waitForFunction(() => window.__wipeAnimation?.playState === 'paused')
      // A desktop click also moves the parallax camera. Let its existing
      // idle return settle before choosing fixed pixels for palette comparisons.
      await page.waitForTimeout(profile.mobile ? 350 : 4000)
      await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(a => a.pause()))
      const { body: projectedBody } = await points(page)
      const mask = await page.evaluate(() => window.__pixelFrame)
      // Sample inside cells, not antialiased boundaries of the CSS-scaled
      // canvas. Slow devices can settle breathing at a subpixel scale.
      const insetSample = (value, phase, size) => {
        const pixel = Math.round(value), offset = ((pixel-phase)%size+size)%size
        return offset < 3 ? pixel+3-offset : offset > size-3 ? pixel-(offset-size+3) : pixel
      }
      const body = projectedBody.map(p => ({ x: insetSample(p.x, mask.phase.x, mask.cell), y: insetSample(p.y, mask.phase.y, mask.cellHeight) }))
      const old = await pixels(page, body)
      await page.screenshot({ path: testInfo.outputPath(`${theme}-old.png`), scale: 'css' })
      await seekPixels(page, '__wipeAnimation', 1)
      // A native clip update and its asynchronous WebGL paint need not land
      // in the same frame, especially with desktop software WebGL. Wait for
      // the observable palette rather than treating 200 ms as a paint fence.
      let next
      await expect.poll(async () => {
        next = await pixels(page, body)
        return next.every((pixel, i) => Math.abs(pixel[0] - old[i][0]) > 65)
      }, { timeout: 5000 }).toBe(true)
      await page.screenshot({ path: testInfo.outputPath(`${theme}-new.png`), scale: 'css' })
      const frame = await page.evaluate(() => window.__pixelFrame)
      // Glitches have three events; a median final threshold can land while
      // every sampled cell is briefly on the same palette. Seek between actual
      // events and require both palettes before comparing rendered pixels.
      const events = [...new Set(body.flatMap(p => expectedPixelEvents(frame, Math.round(p.x), Math.round(p.y))))].sort((a, b) => a - b)
      const progress = events.slice(1).map((time, i) => (events[i] + time) / 2).find(progress => {
        const selected = body.filter(p => expectedPixelState({ ...frame, progress }, Math.round(p.x), Math.round(p.y))).length
        return selected > 0 && selected < body.length
      })
      expect(progress, 'cube samples must cross independently scheduled grid cells').toBeDefined()
      await seekPixels(page, '__wipeAnimation', progress)
      const selections = body.map(p=>expectedPixelState({...frame,progress},Math.round(p.x),Math.round(p.y)))
      let mixed
      await expect.poll(async () => {
        mixed = await pixels(page, body)
        return mixed.every((pixel, i) => pixel.every((value, c) =>
          Math.abs(value - (selections[i] ? next[i] : old[i])[c]) < 25))
      }, { timeout: 5000 }).toBe(true)
      await testInfo.attach(`${theme} pixel colors`, { body: JSON.stringify({ old, next, mixed, selections, progress, frame, body }), contentType: 'application/json' })
      await page.screenshot({ path: testInfo.outputPath(`${theme}-split-palette.png`), scale: 'css' })
      expect(selections.filter(Boolean).length).toBeGreaterThan(0)
      expect(selections.filter(Boolean).length).toBeLessThan(body.length)
      for (let i = 0; i < body.length; i++) {
        for (const sample of [old[i], next[i]]) {
          expect(Math.max(...sample) - Math.min(...sample), 'sample stays on the neutral cube body').toBeLessThan(4)
        }
        expect(Math.abs(old[i][0] - next[i][0]), 'body palettes must visibly differ').toBeGreaterThan(65)
        const expected = selections[i] ? next[i] : old[i]
        for (let c = 0; c < 3; c++) expect(Math.abs(mixed[i][c] - expected[c]), `pixel ${i}, channel ${c}`).toBeLessThan(25)
      }
      await page.evaluate(() => { window.__wipeAnimation.finish(); window.__wipeAnimation = null })
      await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/)
      await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', theme)
    }
    expect(errors).toEqual([])
  })
})
