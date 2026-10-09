import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const profiles = [
  { name: 'desktop worker', width: 1440, height: 900 },
  { name: 'phone worker', width: 430, height: 800, touch: true },
  { name: 'tablet worker', width: 820, height: 1180, touch: true },
  { name: 'low-end phone', width: 430, height: 800, touch: true, low: true },
  { name: 'throttled low-end phone', width: 430, height: 800, touch: true, low: true, throttle: true },
  { name: 'throttled low-end fallback', width: 430, height: 800, touch: true, low: true, throttle: true, fallback: true },
  { name: 'phone fallback', width: 430, height: 800, touch: true, fallback: true },
  { name: 'desktop fallback', width: 1440, height: 900, fallback: true },
  { name: 'no view transitions', width: 430, height: 800, touch: true, noWipe: true },
  { name: 'reduced motion phone', width: 430, height: 800, touch: true, reduced: true },
]

async function facePoint(page, name, localY = 0) {
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
  const point = new THREE.Vector3(.15, localY, .006)
    .applyEuler(new THREE.Euler(...face.rotation)).add(new THREE.Vector3(...face.position))
    .applyEuler(new THREE.Euler(-20 * Math.PI / 180, -45 * Math.PI / 180, 0))
    .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  return { x: rect.x + (point.x + 1) * rect.width / 2, y: rect.y + (1 - point.y) * rect.height / 2 }
}

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch,
      hasTouch: !!profile.touch, serviceWorkers: 'block', reducedMotion: profile.reduced ? 'reduce' : 'no-preference' })
    test('changes both themes without restarting motion or replacing the cube', async ({ page }, testInfo) => {
      test.setTimeout(60000)
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      if (profile.throttle) {
        const session = await page.context().newCDPSession(page)
        await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
      }
      await page.addInitScript(profile => {
        if (window.top !== window || location.protocol !== 'http:') return
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
        if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
        if (profile.noWipe) document.startViewTransition = undefined
        window.__themeFrames = []
        window.__themeCaptures = []
        const native = document.startViewTransition?.bind(document)
        if (native) document.startViewTransition = (...args) => {
          const transition = native(...args)
          transition.ready.then(() => window.__themeCaptures.push({
            cubeOld: getComputedStyle(document.documentElement, '::view-transition-old(home-cube-motion)').display,
            gridOld: getComputedStyle(document.documentElement, '::view-transition-old(home-grid-motion)').display,
            cubeNew: getComputedStyle(document.documentElement, '::view-transition-new(home-cube-motion)').animationName,
          })).catch(error => window.__themeCaptures.push({ error: error.message }))
          return transition
        }
      }, profile)
      await page.goto('./')
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      if (!profile.reduced) await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
      await page.waitForTimeout(500)
      await page.evaluate(() => {
        const ids = new WeakMap(); let id = 0
        const animation = (element, pseudo) => {
          const entry = element?.getAnimations({ subtree: true }).find(a =>
            pseudo ? a.animationName === 'drift' : a.effect?.getTiming().iterations === Infinity)
          if (!entry) return null
          if (!ids.has(entry)) ids.set(entry, ++id)
          return { id: ids.get(entry), time: entry.currentTime, state: entry.playState }
        }
        const canvas = document.querySelector('.cube-entrance canvas')
        const sample = () => {
          const viewport = document.querySelector('.portfolio-viewport')
          const root = document.documentElement
          const direction = root.dataset.themeDirection
          const pseudo = direction === 'to-dark' ? '::view-transition-new(root)' : '::view-transition-old(root)'
          const circle = direction && getComputedStyle(root, pseudo).clipPath.match(/^circle\(([\d.]+)% at ([\d.]+)px ([\d.]+)px\)/)
          const center = getComputedStyle(document.querySelector('.cube-breath')).transformOrigin.split(' ').map(Number.parseFloat)
          const wipeOffset = circle ? Number(circle[1]) / 100 * Math.hypot(root.clientWidth, root.clientHeight) / Math.SQRT2
            - Math.hypot(center[0] - Number(circle[2]), center[1] - Number(circle[3])) : null
          window.__themeFrames.push({
            time: performance.now(), theme: document.documentElement.dataset.theme,
            cubeTheme: document.querySelector('.cube-entrance').dataset.cubeTheme,
            direction, wipeOffset,
            transitioning: document.documentElement.classList.contains('theme-transitioning'),
            paused: viewport.dataset.homeMotionPaused,
            sameCanvas: canvas === document.querySelector('.cube-entrance canvas'),
            grid: animation(document.querySelector('.void-grid-drift')),
            floor: animation(document.querySelector('.home-stage-backdrop__floor'), '::before'),
            breath: animation(document.querySelector('.cube-breath')),
          })
          window.__themeFrame = requestAnimationFrame(sample)
        }
        sample()
      })
      // Project real face coordinates while leaving breathing enabled. Its
      // current uniform transform is included in facePoint's canvas rectangle.
      for (const theme of ['demain-soir-bleu', 'clair-obscur', 'demain-soir-bleu']) {
        const point = await facePoint(page, 'theme')
        if (profile.touch) await page.touchscreen.tap(point.x, point.y)
        else await page.mouse.click(point.x, point.y)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme, { timeout: 10000 })
        if (!profile.reduced) {
          await page.waitForTimeout(400)
          await page.screenshot({ path: testInfo.outputPath(`${theme}-reveal.png`), scale: 'css' })
        }
        await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/, { timeout: 10000 })
        await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', theme)
        await page.waitForTimeout(200)
      }
      const frames = await page.evaluate(() => { cancelAnimationFrame(window.__themeFrame); return window.__themeFrames })
      await testInfo.attach('theme frames', { body: JSON.stringify(frames), contentType: 'application/json' })
      expect(frames.every(f => f.sameCanvas && f.paused === 'false')).toBe(true)
      for (const key of ['grid', 'floor', 'breath']) {
        const motion = frames.map(f => f[key]).filter(Boolean)
        if (profile.reduced) expect(motion).toHaveLength(0)
        else {
          expect(motion.length).toBe(frames.length)
          expect(new Set(motion.map(a => a.id)).size).toBe(1)
          expect(motion.every(a => a.state === 'running')).toBe(true)
          expect(motion.every((a, i) => i === 0 || a.time >= motion[i - 1].time)).toBe(true)
          if (!profile.noWipe) expect(motion.at(-1).time - motion[0].time).toBeGreaterThan(6000)
        }
      }
      const captures = await page.evaluate(() => window.__themeCaptures)
      if (!profile.reduced && !profile.noWipe) {
        expect(captures).toHaveLength(3)
        expect(captures.every(c => !c.error && c.cubeOld === 'none' && c.gridOld === 'none' && c.cubeNew === 'none')).toBe(true)
        expect(frames.some(f => f.transitioning)).toBe(true)
        for (const direction of ['to-dark', 'to-light']) {
          const reveal = frames.filter(f => f.direction === direction && f.wipeOffset !== null)
          // The source palette stays stable during the pixel mask; only the
          // finished transition commits it. Sample both sides of the center.
          const before = reveal.filter(f => direction === 'to-dark' ? f.wipeOffset < -8 : f.wipeOffset > 8)
          const after = reveal.filter(f => direction === 'to-dark' ? f.wipeOffset > 40 : f.wipeOffset < -40)
          expect(before.length).toBeGreaterThan(0)
          expect(before.every(f => f.cubeTheme !== f.theme)).toBe(true)
          expect(after.length).toBeGreaterThan(0)
          expect(reveal.every(f => f.cubeTheme !== f.theme)).toBe(true)
        }
      } else {
        expect(captures).toHaveLength(0)
      }
      await expect(page.getByRole('dialog')).toHaveCount(0)
      if (profile.touch && !profile.fallback) {
        // Palette synchronization must not leave mobile/low-end rendering busy
        // after the highlight settles; breathing remains a compositor animation.
        await page.waitForTimeout(1600)
        const draws = await page.locator('.cube-breath').getAttribute('data-scene-draws')
        await page.waitForTimeout(400)
        expect(await page.locator('.cube-breath').getAttribute('data-scene-draws')).toBe(draws)
      }
      expect(errors).toEqual([])
      await testInfo.attach('continuous theme motion', { body: JSON.stringify({ frames, captures }), contentType: 'application/json' })
    })
  })
}

test.describe('cold theme labels', () => {
  test.use({ viewport: { width: 430, height: 800 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' })
  test('keeps the complete previous cube palette until new atlases arrive', async ({ page }, testInfo) => {
    test.setTimeout(45000)
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
    })
    let release; let blocked = 0
    const held = new Promise(resolve => { release = resolve })
    await page.route('**/*-demain-*.webp', async route => { blocked++; await held; await route.continue() })
    try {
      await page.goto('./')
      await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
      await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(a => a.pause()))
      const body = await facePoint(page, 'projects', .55)
      const brightness = async () => {
        const shot = await page.screenshot({ scale: 'css' })
        return page.evaluate(async ({ shot, body }) => {
          const image = new Image(); image.src = 'data:image/png;base64,' + shot; await image.decode()
          const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
          const pixels = ctx.getImageData(Math.round(body.x) - 2, Math.round(body.y) - 2, 5, 5).data
          let sum = 0
          for (let i = 0; i < pixels.length; i += 4) sum += (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3
          return sum / 25
        }, { shot: shot.toString('base64'), body })
      }
      expect(await brightness()).toBeLessThan(95)
      const point = await facePoint(page, 'theme')
      await page.touchscreen.tap(point.x, point.y)
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'demain-soir-bleu')
      await expect.poll(() => blocked).toBeGreaterThan(0)
      await page.waitForTimeout(400)
      // A delayed label response must not expose a light body with old white
      // text. Keep the old fully readable cube until all new faces are ready.
      expect(await brightness()).toBeLessThan(95)
      await page.screenshot({ path: testInfo.outputPath('waiting-for-new-palette.png'), scale: 'css' })
      release()
      await expect.poll(brightness, { timeout: 10000 }).toBeGreaterThan(115)
      await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/)
      await page.screenshot({ path: testInfo.outputPath('complete-new-palette.png'), scale: 'css' })
    } finally { release() }
  })
})
