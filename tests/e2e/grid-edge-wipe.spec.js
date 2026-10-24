import { installPixelProbe, seekPixels } from './helpers/pixel-probe.js'
import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const profiles = [
  { name: 'desktop', width: 1440, height: 900, dpr: 2 },
  { name: 'low-end fallback phone', width: 430, height: 800, dpr: 3, mobile: true, low: true },
]

async function themePoint(page) {
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
  camera.position.x = layout.restingX - (info.center[0] - info.width / 2) * 5 / focal
  camera.position.y = layout.restingY - (info.height / 2 - info.center[1]) * 5 / focal
  camera.updateMatrixWorld()
  const face = FACE_CONFIG.find(face => face.name === 'theme')
  const point = new THREE.Vector3(.15, 0, .006).applyEuler(new THREE.Euler(...face.rotation))
    .add(new THREE.Vector3(...face.position)).applyEuler(new THREE.Euler(...info.rotation.map(n => n * Math.PI / 180), 0))
    .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  return { x: info.rect.x + (point.x + 1) / 2 * info.rect.width,
    y: info.rect.y + (1 - point.y) / 2 * info.rect.height }
}

async function inspectWallpaper(page, clip, mask) {
  const before = { ...await page.evaluate(() => window.__pixelFrame), progress:mask.progress, targetDark:mask.targetDark }
  const png = await page.screenshot({ clip, scale: 'css' })
  const after = { ...await page.evaluate(() => window.__pixelFrame), progress:mask.progress, targetDark:mask.targetDark }
  const pixels = await page.evaluate(async ({ png, clip, mask, after }) => {
    const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let checked = 0, mismatches = 0, lines = 0
    const bands = Array.from({ length: Math.ceil(image.height / 16) }, () => ({ checked: 0, lines: 0 }))
    // Sample every pixel: a 2px stride can miss all 1px grid lines when the
    // animated tile happens to land on odd coordinates. Independent narrow
    // bands also catch the rectangular line dropout shown in the recording.
    for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
      const px=x+clip.x, py=y+clip.y
      if (Math.min(window.__pixelEdge(mask,px,py),window.__pixelEdge(after,px,py))<2) {
        // Grid lines intentionally align with cell edges. Count their ink
        // independently while excluding antialiased edges from palette checks.
        const offset=(y*image.width+x)*4
        const ink=Math.min(...[[0,36,81],[242,242,242]].map(base=>Math.max(...base.map((v,i)=>Math.abs(data[offset+i]-v)))))
        if(ink>=2&&ink<=55){lines++;bands[Math.floor(y/16)].lines++}
        continue
      }
      const switched=window.__pixelState(mask,px,py)
      if(switched!==window.__pixelState(after,px,py)) continue
      const dark=switched===mask.targetDark, base=dark?[0,36,81]:[242,242,242]
      const start = (y * image.width + x) * 4
      const error = Math.max(...base.map((value, i) => Math.abs(data[start + i] - value)))
      checked++
      bands[Math.floor(y / 16)].checked++
      if (error > 55) mismatches++
      else if (error >= (dark ? 2 : 4)) { lines++; bands[Math.floor(y / 16)].lines++ }
    }
    return { checked, mismatches, lines, bands, width: image.width, height: image.height }
  }, { png: png.toString('base64'), clip, mask:before, after })
  return { png, pixels }
}

for (const profile of profiles) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, deviceScaleFactor: profile.dpr,
    isMobile: !!profile.mobile, hasTouch: !!profile.mobile, serviceWorkers: 'block' })
  test('keeps the moving wallpaper continuous at every wipe edge and corner crossing', async ({ page }, testInfo) => {
    test.setTimeout(180000)
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await installPixelProbe(page)
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
      if (profile.low) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      window.__edgeCoverage = []
      window.addEventListener('theme-wipe-start', event => {
        window.__edgeAnimation = event.detail.animation
        event.detail.animation.pause(); event.detail.animation.currentTime = 1
      })
      window.addEventListener('cube-wipe-frame', event => {
        window.__edgeMask = event.detail
        const grids = [...document.querySelectorAll('.home-grid-wipe')]
        const surface = grids.find(element => element.classList.contains('home-grid-wipe__surface'))
        const source = grids.find(element => element !== surface)
        window.__edgeCoverage.push({ count: grids.length,
          surfaceCount: document.querySelectorAll('.home-grid-wipe__surface').length,
          sourceClip: source ? getComputedStyle(source).clipPath : null,
          surfaceClip: surface ? getComputedStyle(surface).clipPath : null,
          sourceOpacity: source ? getComputedStyle(source).opacity : null,
          surfaceOpacity: surface ? getComputedStyle(surface).opacity : null,
          isCanvas: surface instanceof HTMLCanvasElement,
          hasPixels: surface instanceof HTMLCanvasElement && surface.width > 0 && surface.height > 0,
          duplicateDrifts: surface?.getAnimations({ subtree: true }).filter(a => a.animationName === 'drift').length,
        })
      })
    }, profile)
    if (profile.low) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
    await page.evaluate(() => {
      window.__edgeSource = document.querySelector('.home-grid-wipe')
      window.__edgeDriftNode = document.querySelector('.void-grid-drift')
      window.__edgeDrift = window.__edgeSource.getAnimations({ subtree: true }).find(a => a.animationName === 'drift')
      window.__edgeFloor = document.querySelector('.home-stage-backdrop__floor')
      window.__edgeFloorDrift = document.querySelector('.home-stage-backdrop').getAnimations({ subtree: true }).find(a => a.animationName === 'drift')
      window.__edgePreviousTime = window.__edgeDrift.currentTime
    })
    // Only hide unrelated foreground ink for the pixel fixture, after a real
    // theme-face click. The grid/floor DOM and their animations remain live.
    const foreground = await page.addStyleTag({ content: '.cube-entrance canvas, .home-sidebar-wipe, .home-chrome { visibility: hidden !important; }' })
    await foreground.evaluate(element => { element.media = 'not all' })
    const clip = { x: 0, y: 24, width: profile.width, height: Math.floor(profile.height * .42) - 24 }
    const measurements = []
    for (const expand of [true, false]) {
      await foreground.evaluate(element => { element.media = 'not all' })
      const click = await themePoint(page)
      if (profile.mobile) await page.touchscreen.tap(click.x, click.y)
      else await page.mouse.click(click.x, click.y)
      await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(4)
      await expect.poll(() => page.evaluate(() => window.__edgeAnimation?.playState)).toBe('paused')
      await foreground.evaluate(element => { element.media = 'all' })
      const progresses = [0, .1, .25, .4, .55, .7, .9, 1]
      for (const [index, progress] of progresses.entries()) {
        const mask = { ...await seekPixels(page, '__edgeAnimation', progress), targetDark: expand }
        const state = await page.evaluate(() => {
          const original = window.__edgeSource.getAnimations({ subtree: true }).find(a => a.animationName === 'drift')
          const copiedFloor = document.querySelector('.home-stage-backdrop[data-wipe-palette="new"]')
          const duplicate = copiedFloor.getAnimations({ subtree: true }).find(a => a.animationName === 'drift')
          const sourceMatrix = new DOMMatrix(getComputedStyle(window.__edgeFloor).transform).toFloat64Array()
          const copyMatrix = new DOMMatrix(getComputedStyle(copiedFloor.querySelector('.home-stage-backdrop__floor')).transform).toFloat64Array()
          const now = original.currentTime, elapsed = now - window.__edgePreviousTime
          window.__edgePreviousTime = now
          return { originalIsSame: original === window.__edgeDrift,
            originalNodeConnected: window.__edgeDriftNode.isConnected && window.__edgeSource.contains(window.__edgeDriftNode),
            floorIsSame: document.querySelector('.home-stage-backdrop__floor') === window.__edgeFloor,
            floorClockIsSame: document.querySelector('.home-stage-backdrop').getAnimations({ subtree: true }).find(a => a.animationName === 'drift') === window.__edgeFloorDrift,
            states: [original.playState, duplicate.playState, window.__edgeFloorDrift.playState], elapsed,
            floorClockDifference: Math.abs(window.__edgeFloorDrift.currentTime - duplicate.currentTime),
            floorMatrixDifference: Math.max(...sourceMatrix.map((value, index) => Math.abs(value - copyMatrix[index]))),
            coverage: window.__edgeCoverage.at(-1) }
        })
        expect(state.originalIsSame && state.originalNodeConnected && state.floorIsSame && state.floorClockIsSame).toBe(true)
        expect(state.states).toEqual(['running', 'running', 'running'])
        expect(state.elapsed).toBeGreaterThan(0)
        expect(state.floorClockDifference).toBeLessThan(1)
        expect(state.floorMatrixDifference).toBeLessThan(.1)
        expect(state.coverage).toEqual({ count: 2, surfaceCount: 1, sourceClip: 'none', surfaceClip: 'none',
          sourceOpacity: '0', surfaceOpacity: '1', isCanvas: true, hasPixels: true, duplicateDrifts: 0 })
        const { png, pixels } = await inspectWallpaper(page, clip, mask)
        expect(pixels.checked).toBeGreaterThan(500)
        expect(pixels.mismatches, `palette gap at ${expand ? 'expanding' : 'shrinking'} progress ${progress}`).toBe(0)
        expect(pixels.lines, 'moving grid lines stay visible at viewport mask boundaries').toBeGreaterThan(30)
        expect(pixels.bands.every(band => band.checked < 100 || band.lines > Math.max(2, Math.floor(clip.width / 150))),
          'each horizontal band retains its moving grid lines').toBe(true)
        measurements.push({ expand, progress, ...pixels, ...state })
        if (index === Math.floor(progresses.length / 2)) await testInfo.attach(`${expand ? 'expanding' : 'shrinking'} edge-crossing wallpaper`, {
          body: png, contentType: 'image/png',
        })
      }
      await page.evaluate(() => window.__edgeAnimation.finish())
      await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(0)
      await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/)
      const finalCircle = { ...await page.evaluate(() => window.__pixelFrame), progress: 1, targetDark: expand }
      const { pixels } = await inspectWallpaper(page, clip, finalCircle)
      expect(pixels.mismatches, 'committing the final palette must not expose a gap or reverse the reveal').toBe(0)
      expect(pixels.lines).toBeGreaterThan(30)
      expect(pixels.bands.every(band => band.checked < 100 || band.lines > Math.max(2, Math.floor(clip.width / 150)))).toBe(true)
      expect(await page.evaluate(() => document.querySelector('.home-grid-wipe') === window.__edgeSource &&
        document.querySelector('.void-grid-drift') === window.__edgeDriftNode && !window.__edgeSource.style.clipPath &&
        !window.__edgeSource.style.opacity && getComputedStyle(window.__edgeSource).opacity === '1' &&
        !window.__edgeSource.style.getPropertyValue('--void-grid') && window.__edgeDrift.playState === 'running')).toBe(true)
    }
    const coverage = await page.evaluate(() => window.__edgeCoverage)
    expect(coverage.length).toBeGreaterThan(20)
    expect(coverage.every(sample => sample.count === 2 && sample.surfaceCount === 1 && sample.isCanvas && sample.hasPixels &&
      sample.sourceClip === 'none' && sample.surfaceClip === 'none' && sample.sourceOpacity === '0' &&
      sample.surfaceOpacity === '1' && sample.duplicateDrifts === 0)).toBe(true)
    await testInfo.attach('running grid edge and corner measurements', { body: JSON.stringify({ measurements, coverage }), contentType: 'application/json' })
    expect(errors).toEqual([])
  })
})
