import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { writeFile } from 'node:fs/promises'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'
import { analyzeWipePlayback } from '../helpers/wipePlaybackAnalysis.js'

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
  { name: 'recorded desktop', width: 2536, height: 1310, dpr: 1, backgroundOnly: true },
  { name: 'recorded high-DPR desktop', width: 2536, height: 1310, dpr: 2 },
  { name: 'high-DPR desktop', width: 1440, height: 900, dpr: 2 },
  { name: 'high-DPR fallback', width: 1440, height: 900, dpr: 2, fallback: true },
  { name: 'throttled low-end phone', width: 430, height: 800, dpr: 3, mobile: true, low: true, fallback: true },
]

for (const profile of profiles) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: profile.dpr,
    serviceWorkers: 'block', isMobile: !!profile.mobile, hasTouch: !!profile.mobile })
  test('never reverses the background reveal during complete unpaused wipes', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const gpu = await (await page.context().browser().newBrowserCDPSession()).send('SystemInfo.getInfo')
    await testInfo.attach('renderer', { body: JSON.stringify(gpu.gpu), contentType: 'application/json' })
    await writeFile(testInfo.outputPath('renderer.json'), JSON.stringify(gpu.gpu))
    if (process.env.PLAYWRIGHT_REQUIRE_HARDWARE_GPU === '1') {
      expect(gpu.gpu.featureStatus.gpu_compositing, 'this run must exercise hardware compositing').toBe('enabled')
      expect(gpu.gpu.featureStatus.rasterization, 'this run must exercise hardware rasterization').toBe('enabled')
    }
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
      if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      window.__nativeCaptures = 0
      document.startViewTransition = () => { window.__nativeCaptures++; throw new Error('theme wipes must not capture the viewport') }
      window.addEventListener('theme-wipe-start', e => {
        window.__playbackAnimation = e.detail.animation
        window.__playbackTicks = []
      })
      window.addEventListener('cube-wipe-frame', e => {
        window.__playbackTicks?.push({ timestamp: performance.now(), radius: e.detail.radius, origin: e.detail.origin })
      })
    }, profile)
    const session = await page.context().newCDPSession(page)
    if (profile.low) await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
    // Bring the theme face forward, as in the recording. Exercise both the
    // initial resting layout and the actual rotated face-click origin.
    if (!profile.mobile) {
      const body = (await points(page)).body[0]
      await page.mouse.move(body.x, body.y); await page.mouse.down()
      await page.mouse.move(body.x + 2, body.y - 106, { steps: 10 }); await page.mouse.up()
      await page.waitForTimeout(1300)
    }
    const canvas = await page.locator('.cube-entrance canvas').elementHandle()
    await page.evaluate(() => { window.__labelNodes = [...document.querySelector('.home-theme-label__value').childNodes] })
    // The large recorded viewport needs a background-only capture fixture:
    // software GL readback can otherwise undersample the short middle of the
    // real two-second wipe. Keep its canvas/resources and all grid clocks;
    // the other worker/fallback profiles still capture the complete scene.
    if (profile.backgroundOnly && gpu.gpu.featureStatus.gpu_compositing !== 'enabled') await page.addStyleTag({ content: '.cube-entrance canvas { opacity: 0 !important; }' })
    let frames = []
    session.on('Page.screencastFrame', frame => {
      frames.push(frame)
      session.send('Page.screencastFrameAck', { sessionId: frame.sessionId }).catch(() => {})
    })
    // Stream the whole production-duration wipe. The recorded desktop uses
    // its real CSS size; high-DPR playback uses a common 2880x1800 display.
    // 5072x2620 spatial masks remain covered by grid-wipe.spec.js.
    // Repeated screenshots or
    // stretching the animation can miss the brief later-phase reversion.
    await session.send('Page.startScreencast', { format: 'jpeg', quality: 75, maxWidth: 800, maxHeight: 480, everyNthFrame: 1 })
    try {
      for (const [index, expand] of [true, false, true].entries()) {
        frames = []
        await page.waitForTimeout(150)
        const { click } = await points(page)
        if (profile.mobile) await page.touchscreen.tap(click.x, click.y)
        else await page.mouse.click(click.x, click.y)
        await expect(page.locator('html')).toHaveClass(/theme-transitioning/)
        await page.evaluate(() => window.__playbackAnimation.finished)
        expect(await page.evaluate(() => document.querySelector('.portfolio-viewport').getAnimations({ subtree: true })
          .filter(a => a instanceof CSSTransition && ['color', 'background-color', 'border-color', 'fill', 'stroke'].includes(a.transitionProperty)).length),
        'committing the palette must not start another color crossfade').toBe(0)
        // Include final asynchronous WebGL presentation in the stream.
        await page.waitForTimeout(profile.mobile ? 700 : 1800)
        const captured = frames.slice()
        const timing = await page.evaluate(() => ({ ticks: window.__playbackTicks, timeOrigin: performance.timeOrigin,
          viewport: { width: innerWidth, height: innerHeight } }))
        const measurements = await page.evaluate(analyzeWipePlayback, { captured, ...timing })
        const ticks = timing.ticks
        await testInfo.attach(`wipe-${index}-playback`, { body: JSON.stringify({ expand, measurements, ticks }), contentType: 'application/json' })
        await writeFile(testInfo.outputPath(`wipe-${index}-playback.json`), JSON.stringify({ expand, measurements, ticks }))
        for (let i = 0; i < measurements.length; i++) {
          const reversal = i && (measurements[i].dark - measurements[i - 1].dark) * (expand ? 1 : -1) < -.02
          if (reversal || measurements[i].fraction > .02) await writeFile(testInfo.outputPath(`wipe-${index}-drop-${i}.jpg`), Buffer.from(captured[i].data, 'base64'))
        }
        expect(measurements.length, 'capture the beginning, middle and end of the real wipe').toBeGreaterThan(3)
        expect(measurements.every(m => m.valid > 100)).toBe(true)
        if (process.env.PLAYWRIGHT_REQUIRE_FULL_CAPTURE === '1') {
          expect(measurements.every(m => m.capture.consistent && m.capture.cssWidth >= profile.width * .98 &&
            m.capture.cssHeight >= profile.height * .98), 'hardware capture must include the complete emulated viewport').toBe(true)
        }
        for (const m of measurements.filter(m => m.inspected > 100)) {
          expect(m.fraction, 'each presented background must retain its circular shape').toBeLessThan(.02)
          expect(m.bands.filter(b => b.inspected > 40).every(b => b.fraction < .08), 'no rectangular palette dropout in any horizontal band').toBe(true)
        }
        if (process.env.PLAYWRIGHT_REQUIRE_HARDWARE_GPU === '1') {
          expect(measurements.filter(m => m.dark > .02 && m.dark < .98).length, 'hardware playback must capture the mixed circular reveal densely').toBeGreaterThan(10)
        }
        for (let i = 1; i < measurements.length; i++) {
          if (measurements[i].captureExtentChanged) continue
          const change = measurements[i].dark - measurements[i - 1].dark
          expect(expand ? change : -change, 'the reveal must never revert to its previous palette mid-wipe').toBeGreaterThanOrEqual(-.02)
        }
        expect(Math.abs(measurements.at(-1).dark - (expand ? 1 : 0)), 'final background palette').toBeLessThan(.02)
        expect(measurements.some(m => m.dark > .02 && m.dark < .98), 'capture a spatially mixed background').toBe(true)
        const mixed = measurements.findIndex(m => m.dark > .02 && m.dark < .98)
        for (const frameIndex of [0, mixed, captured.length - 1]) {
          const body = Buffer.from(captured[frameIndex].data, 'base64')
          await writeFile(testInfo.outputPath(`wipe-${index}-frame-${frameIndex}.jpg`), body)
          await testInfo.attach(`wipe-${index}-frame-${frameIndex}`, { body, contentType: 'image/jpeg' })
        }
        await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(0)
        await expect(page.locator('.home-theme-label__value')).toHaveText(expand ? 'THEME: DEMAIN_SOIR_BLEU' : 'THEME: CLAIR_OBSCUR')
        expect(await page.evaluate(() => window.__labelNodes.every((node, i) => node === document.querySelector('.home-theme-label__value').childNodes[i]))).toBe(true)
        expect(await canvas.evaluate(c => c === document.querySelector('.cube-entrance canvas'))).toBe(true)
        await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', expand ? 'demain-soir-bleu' : 'clair-obscur')
      }
    } finally { await session.send('Page.stopScreencast') }
    expect(await page.evaluate(() => window.__nativeCaptures)).toBe(0)
    expect(errors).toEqual([])
  })
})

test.describe('background-tab interruption', () => {
  test.use({ viewport: { width: 430, height: 800 }, deviceScaleFactor: 1, serviceWorkers: 'block' })
  test('finishes and releases a shared wipe when the page becomes hidden', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 })
      window.__nativeCaptures = 0
      document.startViewTransition = () => { window.__nativeCaptures++; throw new Error('theme wipes must not capture the viewport') }
      window.addEventListener('theme-wipe-start', e => { window.__playbackAnimation = e.detail.animation })
    })
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
    const { click } = await points(page)
    await page.mouse.click(click.x, click.y)
    await expect(page.locator('html')).toHaveClass(/theme-transitioning/)
    await page.evaluate(() => Boolean(window.__playbackAnimation))
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/)
    await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(0)
    await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', 'demain-soir-bleu')
    expect(await page.locator('.home-grid-palette, .home-stage-backdrop').evaluateAll(elements =>
      elements.every(e => !e.style.clipPath && !e.style.getPropertyValue('--void-grid')))).toBe(true)
    await page.evaluate(() => {
      delete document.visibilityState
      document.dispatchEvent(new Event('visibilitychange'))
    })
    const next = (await points(page)).click
    await page.mouse.click(next.x, next.y)
    await expect(page.locator('html')).toHaveClass(/theme-transitioning/)
    await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/, { timeout: 8000 })
    await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', 'clair-obscur')
  })
})
