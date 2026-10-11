import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

test.use({ viewport: { width: 430, height: 800 }, deviceScaleFactor: 3,
  isMobile: true, hasTouch: true, serviceWorkers: 'block' })

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

async function openPortfolio(page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 })
    Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
    HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
    window.addEventListener('theme-wipe-start', event => {
      window.__surfaceAnimation = event.detail.animation
      event.detail.animation.pause()
      event.detail.animation.currentTime = 1
      window.__heldSurface = document.querySelector('.home-grid-wipe__surface')
    })
  })
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
  await expect(page.locator('.home-grid-wipe__surface')).toHaveCount(0)
  await page.evaluate(() => {
    window.__originalWallpaper = document.querySelector('.home-grid-wipe')
    window.__originalDriftNode = document.querySelector('.void-grid-drift')
  })
}

async function startWipe(page, theme) {
  const point = await themePoint(page)
  await page.touchscreen.tap(point.x, point.y)
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  await expect(page.locator('.home-grid-wipe__surface')).toHaveCount(1)
  await expect.poll(() => page.evaluate(() => window.__surfaceAnimation?.playState)).toBe('paused')
  // A DPR 3 device must not allocate nine times the wallpaper's CSS area.
  const backing = await page.locator('.home-grid-wipe__surface').evaluate(canvas => ({
    width: canvas.width, height: canvas.height,
    cssWidth: Math.ceil(canvas.getBoundingClientRect().width),
    cssHeight: Math.ceil(canvas.getBoundingClientRect().height), dpr: devicePixelRatio,
  }))
  expect(backing.dpr).toBe(3)
  expect(backing.width).toBe(backing.cssWidth)
  expect(backing.height).toBe(backing.cssHeight)
}

async function restState(page, theme) {
  await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(0)
  await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/)
  await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', theme)
  const state = await page.evaluate(() => ({
    backingReleased: !window.__heldSurface.isConnected && window.__heldSurface.width === 0 && window.__heldSurface.height === 0,
    sameWallpaper: document.querySelector('.home-grid-wipe') === window.__originalWallpaper,
    sameDrift: document.querySelector('.void-grid-drift') === window.__originalDriftNode,
    opacityRestored: !window.__originalWallpaper.style.opacity && getComputedStyle(window.__originalWallpaper).opacity === '1',
    paletteReleased: !window.__originalWallpaper.style.getPropertyValue('--void-bg') &&
      !window.__originalWallpaper.style.getPropertyValue('--void-grid'),
    color: getComputedStyle(window.__originalWallpaper).backgroundColor,
  }))
  expect(state).toEqual({ backingReleased: true, sameWallpaper: true, sameDrift: true,
    opacityRestored: true, paletteReleased: true,
    color: theme === 'demain-soir-bleu' ? 'rgb(0, 36, 81)' : 'rgb(232, 230, 225)' })
}

async function seekCircle(page, radius) {
  return page.evaluate(async radius => {
    const animation = window.__surfaceAnimation
    const maximum = 1.5 * Math.hypot(document.documentElement.clientWidth, document.documentElement.clientHeight) / Math.SQRT2
    const expand = document.documentElement.dataset.themeDirection === 'to-dark'
    let low = 0, high = animation.effect.getTiming().duration
    for (let i = 0; i < 28; i++) {
      animation.currentTime = (low + high) / 2
      const progress = animation.effect.getComputedTiming().progress
      const actual = maximum * (expand ? progress : 1 - progress)
      if ((actual < radius) === expand) low = animation.currentTime
      else high = animation.currentTime
    }
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    return { radius: maximum * (expand ? animation.effect.getComputedTiming().progress : 1 - animation.effect.getComputedTiming().progress),
      origin: { x: parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-x')),
        y: parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-y')) } }
  }, radius)
}

async function wallpaperPixels(page, clip, circle) {
  const screenshot = await page.screenshot({ clip, scale: 'css' })
  const pixels = await page.evaluate(async ({ png, clip, circle }) => {
    const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
    let inside = 0, outside = 0, mismatches = 0
    for (let y = 0; y < image.height; y += 3) for (let x = 0; x < image.width; x += 3) {
      const distance = Math.hypot(x + clip.x - circle.origin.x, y + clip.y - circle.origin.y)
      if (Math.abs(distance - circle.radius) < 4) continue
      const dark = distance < circle.radius, expected = dark ? [0, 36, 81] : [232, 230, 225]
      if (dark) inside++; else outside++
      const start = (y * image.width + x) * 4
      if (Math.max(...expected.map((value, channel) => Math.abs(value - data[start + channel]))) > 55) mismatches++
    }
    return { inside, outside, mismatches }
  }, { png: screenshot.toString('base64'), clip, circle })
  return { screenshot, pixels }
}

test('keeps the wallpaper circle painting while the existing cube canvas is temporarily detached', async ({ page }, testInfo) => {
  test.setTimeout(60000)
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await openPortfolio(page)
  await startWipe(page, 'demain-soir-bleu')
  const clip = { x: 0, y: 36, width: 430, height: 300 }
  const foreground = await page.addStyleTag({ content: '.home-sidebar-wipe, .home-chrome { visibility: hidden !important; }' })
  await page.evaluate(() => {
    const canvas = document.querySelector('.cube-entrance canvas')
    window.__resourceCanvas = canvas
    window.__resourceParent = canvas.parentNode
    window.__resourceNextSibling = canvas.nextSibling
    // Reattach this exact canvas; replacing it would discard worker/WebGL resources.
    canvas.remove()
  })
  try {
    const before = await wallpaperPixels(page, clip, await seekCircle(page, 1))
    expect(before.pixels.mismatches).toBe(0)
    expect(before.pixels.inside).toBe(0)
    const crossingRadius = await page.evaluate(clip => {
      const x = parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-x'))
      const y = parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-y'))
      return Math.hypot(clip.x + clip.width / 2 - x, clip.y + clip.height / 2 - y)
    }, clip)
    const mixed = await wallpaperPixels(page, clip, await seekCircle(page, crossingRadius))
    expect(mixed.pixels.mismatches, 'wallpaper keeps using the circle while there is no cube canvas').toBe(0)
    expect(mixed.pixels.inside).toBeGreaterThan(1000)
    expect(mixed.pixels.outside).toBeGreaterThan(1000)
    await testInfo.attach('wallpaper during cube canvas swap', { body: mixed.screenshot, contentType: 'image/png' })
  } finally {
    await page.evaluate(() => window.__resourceParent.insertBefore(window.__resourceCanvas,
      window.__resourceNextSibling?.parentNode === window.__resourceParent ? window.__resourceNextSibling : null))
    await foreground.evaluate(element => element.remove())
  }
  expect(await page.evaluate(() => document.querySelector('.cube-entrance canvas') === window.__resourceCanvas)).toBe(true)
  await page.evaluate(() => window.__surfaceAnimation.finish())
  await restState(page, 'demain-soir-bleu')
  await startWipe(page, 'clair-obscur')
  await page.evaluate(() => window.__surfaceAnimation.finish())
  await restState(page, 'clair-obscur')
  expect(errors).toEqual([])
})

for (const interruption of ['resize', 'reduced motion']) {
  test(`releases a running wallpaper surface after ${interruption} and permits the next theme flip`, async ({ page }) => {
    test.setTimeout(60000)
    const errors = []; page.on('pageerror', error => errors.push(error.message))
    await openPortfolio(page)
    await startWipe(page, 'demain-soir-bleu')
    await page.evaluate(() => { window.__surfaceAnimation.currentTime = 900 })
    if (interruption === 'resize') await page.setViewportSize({ width: 390, height: 800 })
    else await page.emulateMedia({ reducedMotion: 'reduce' })
    await restState(page, 'demain-soir-bleu')
    if (interruption === 'reduced motion') await page.emulateMedia({ reducedMotion: 'no-preference' })
    await startWipe(page, 'clair-obscur')
    await page.evaluate(() => window.__surfaceAnimation.finish())
    await restState(page, 'clair-obscur')
    expect(errors).toEqual([])
  })
}
