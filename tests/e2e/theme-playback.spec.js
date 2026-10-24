import { installPixelProbe, expectedPixelEvents, expectedPixelState } from './helpers/pixel-probe.js'
import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

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



const profiles = [
  { name: 'recorded desktop', width: 2536, height: 1310, dpr: 1, captureDuration: 8 },
  { name: 'high-DPR desktop', width: 2536, height: 1310, dpr: 2, captureDuration: 8 },
  { name: 'high-DPR desktop fallback', width: 2536, height: 1310, dpr: 2, fallback: true, captureDuration: 8 },
  { name: 'throttled low-end phone fallback', width: 430, height: 800, dpr: 3, mobile: true, fallback: true, low: true },
]

async function pixelFrame(page) {
  return page.evaluate(() => window.__pixelFrame)
}

async function readImage(page, png) {
  return page.evaluate(async png => {
    const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    return { width: image.width, height: image.height, pixels: Array.from(ctx.getImageData(0, 0, image.width, image.height).data) }
  }, png.toString('base64'))
}

for (const profile of profiles) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: profile.dpr,
    isMobile: !!profile.mobile, hasTouch: !!profile.mobile, serviceWorkers: 'block' })
  test('keeps the background, grids and branding visible during unpaused wipes', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const errors = []; page.on('pageerror', e => errors.push(e.message))
    await installPixelProbe(page)
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
      if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      window.addEventListener('cube-wipe-frame', e => { window.__liveCircle = e.detail })
      window.addEventListener('theme-wipe-start', e => { window.__playbackAnimation = e.detail.animation })
    }, profile)
    const session = await page.context().newCDPSession(page)
    if (profile.low) await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
    // Desktop software screenshots can consume a two-second wipe.
    // Stretch these single-strip fixtures; full production-duration playback
    // at every desktop/phone profile is checked in theme-recording.spec.js.
    if (profile.captureDuration) await page.evaluate(seconds =>
      document.documentElement.style.setProperty('--theme-transition-duration', `${seconds}s`), profile.captureDuration)
    for (const expand of [true, false]) {
      const { click } = await points(page)
      if (profile.mobile) await page.touchscreen.tap(click.x, click.y)
      else await page.mouse.click(click.x, click.y)
      await expect(page.locator('html')).toHaveClass(/theme-transitioning/)
      await page.evaluate(() => Boolean(window.__playbackAnimation))
      // Read a narrow, empty wallpaper strip rather than a full-screen capture
      // that can itself stall a large software-rendered desktop animation.
      const strip = { x: 0, y: profile.mobile ? 78 : 150, width: profile.width * (profile.mobile ? 1 : .43), height: 20 }
      const before = await pixelFrame(page)
      const shot = await session.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false,
        clip: { ...strip, scale: 1 } })
      const png = Buffer.from(shot.data, 'base64')
      const after = await pixelFrame(page)
      const image = await readImage(page, png)
      let checked = 0, mismatches = 0, lines = 0
      for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
        const events=expectedPixelEvents(before,x+strip.x,y+strip.y)
        if(events.some(t=>t>=before.progress-.03 && t<=after.progress+.03)) continue
        const dark=expectedPixelState(before,x+strip.x,y+strip.y)===expand
        const base = dark ? [0, 36, 81] : [242, 242, 242]
        const pixel = image.pixels.slice((y * image.width + x) * 4, (y * image.width + x) * 4 + 3)
        const error = Math.max(...pixel.map((value, i) => Math.abs(value - base[i])))
        checked++; if (error > 55) mismatches++; else if (error >= (dark ? 2 : 4)) lines++
      }
      await testInfo.attach(`${expand ? 'dark' : 'light'} running wallpaper`, { body: png, contentType: 'image/png' })
      await testInfo.attach('playback pixel measurements', { body: JSON.stringify({ expand, before, after, checked, mismatches, lines }), contentType: 'application/json' })
      expect(checked).toBeGreaterThan(200)
      expect(mismatches, 'old/new background must agree with the running pixel pattern, without blank rectangular patches').toBe(0)
      expect(lines, 'grid lines remain painted during the wipe').toBeGreaterThan(10)
      const mark = page.locator(profile.mobile ? '.mobile-branding__dino' : '.sidebar-home__logo').first()
      const box = await mark.boundingBox()
      const logoShot = await session.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false,
        clip: { ...box, scale: 1 } })
      const logo = await readImage(page, Buffer.from(logoShot.data, 'base64'))
      let ink = 0
      for (let i = 0; i < logo.pixels.length; i += 4) {
        const p = logo.pixels.slice(i, i + 3)
        if (Math.max(...p) - Math.min(...p) < 10 && (Math.max(...p) < 30 || Math.min(...p) > 235)) ink++
      }
      expect(ink / (logo.width * logo.height), 'DINOWEB remains visible through playback').toBeGreaterThan(.05)
      await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/, { timeout: 15000 })
      await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(0)
      await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', expand ? 'demain-soir-bleu' : 'clair-obscur')
      await page.waitForTimeout(500)
    }
    expect(errors).toEqual([])
  })
})
