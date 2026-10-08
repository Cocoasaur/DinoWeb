import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'
import metrics from '../../src/assets/cube-labels/metrics.json' with { type: 'json' }

const profiles = [
  { name: 'mobile worker', dpr: 2, scale: 2 },
  { name: 'mobile dark theme', dark: true, dpr: 2, scale: 2 },
  { name: 'mobile fallback', fallback: true, dpr: 2, scale: 2 },
  { name: 'low-end mobile', low: true, dpr: 1, scale: 1 },
  { name: 'medium mobile', medium: true, dpr: 1.5, scale: 1 },
  { name: 'mobile reduced motion', reduced: true, dpr: 2, scale: 2 },
]

test.use({ viewport: { width: 430, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })

// Project the known initial Projects face into screen space to touch its label
// and inspect pixels along its underline, independently of pointer callbacks.
async function facePoints(page) {
  const canvas = page.locator('.cube-entrance canvas')
  const { width, height, rect } = await canvas.evaluate(element => ({
    width: element.clientWidth, height: element.clientHeight,
    rect: { x: element.getBoundingClientRect().x, y: element.getBoundingClientRect().y,
      width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height },
  }))
  const layout = getHomeViewportLayout(width, height)
  const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100)
  camera.position.z = 5
  camera.updateMatrixWorld()
  const project = (x, y) => {
    const point = new THREE.Vector3(x, y, .02)
      .applyEuler(new THREE.Euler(0, Math.PI / 2, 0)).add(new THREE.Vector3(1.01, 0, 0))
      .applyEuler(new THREE.Euler(-20 * Math.PI / 180, -45 * Math.PI / 180, 0))
      .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
    return { x: rect.x + (point.x + 1) * rect.width / 2, y: rect.y + (1 - point.y) * rect.height / 2 }
  }
  const halfWidth = metrics.Projects.widthRatio * .22 / 2
  return { center: project(0, 0), line: Array.from({ length: 50 }, (_, i) => project(-halfWidth + halfWidth * 2 * i / 49, -.22 * .65)) }
}

async function changedUnderlineSamples(page, before, after, points) {
  return page.evaluate(async ({ before, after, points }) => {
    const decode = async data => {
      const img = new Image()
      img.src = `data:image/png;base64,${data}`
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      return { width: img.width, height: img.height, data: ctx.getImageData(0, 0, img.width, img.height).data }
    }
    const a = await decode(before), b = await decode(after)
    return points.filter(point => {
      for (let y = Math.round(point.y) - 2; y <= Math.round(point.y) + 2; y++) {
        for (let x = Math.round(point.x) - 2; x <= Math.round(point.x) + 2; x++) {
          if (x < 0 || y < 0 || x >= a.width || y >= a.height) continue
          const offset = (y * a.width + x) * 4
          if (Math.abs((b.data[offset] + b.data[offset + 1] + b.data[offset + 2]) - (a.data[offset] + a.data[offset + 1] + a.data[offset + 2])) > 90) return true
        }
      }
      return false
    }).length
  }, { before: before.toString('base64'), after: after.toString('base64'), points })
}

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ reducedMotion: profile.reduced ? 'reduce' : 'no-preference' })
    test('shows the underline on hold, settles rendering, and preserves navigation', async ({ page, context }, testInfo) => {
      const errors = []
      const atlases = []
      page.on('pageerror', error => errors.push(error.message))
      page.on('request', request => {
        if (/projects-clair-.*\.webp|projects-demain-.*\.webp/.test(request.url())) atlases.push(request.url())
      })
      await page.addInitScript(profile => {
        Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
        Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: false, effectiveType: '4g' }) })
        Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : profile.medium ? 4 : 8 })
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
      await expect(page.locator('html')).toHaveAttribute('data-theme', profile.dark ? 'demain-soir-bleu' : 'clair-obscur')
      await page.waitForTimeout(300)
      // Freeze only compositor breathing so the visual comparison has no resampling drift.
      await page.locator('.cube-breath').evaluate(element => element.getAnimations().forEach(animation => animation.pause()))
      const actualDpr = await page.locator('.cube-entrance canvas').evaluate(element => element.width / element.clientWidth)
      expect(actualDpr).toBeCloseTo(profile.dpr, 2)
      expect(atlases.some(url => new RegExp(`projects-.*-${profile.scale}-`).test(url))).toBe(true)
      const { center, line } = await facePoints(page)
      const session = await context.newCDPSession(page)
      const touch = (type, points) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, index) => ({ ...point, id: index, radiusX: 1, radiusY: 1 })) })
      const before = await page.screenshot({ scale: 'css' })
      await touch('touchStart', [center])
      await page.waitForTimeout(100)
      const early = await page.screenshot({ scale: 'css' })
      await page.waitForTimeout(950)
      const held = await page.screenshot({ scale: 'css' })
      await testInfo.attach('held cube', { body: held, contentType: 'image/png' })
      const earlyCount = await changedUnderlineSamples(page, before, early, line)
      const heldCount = await changedUnderlineSamples(page, before, held, line)
      expect(heldCount).toBeGreaterThan(25)
      // Slow screenshot capture can already observe a completed underline.
      if (!profile.reduced && earlyCount < 45) expect(heldCount).toBeGreaterThan(earlyCount + 5)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      const draws = () => page.evaluate(() => Number(document.querySelector('[data-scene-draws]')?.dataset.sceneDraws || window.__glDraws))
      await expect.poll(async () => {
        const settled = await draws()
        await page.waitForTimeout(250)
        return await draws() === settled
      }, { timeout: 5000 }).toBe(true)
      // Cancelling a hold must clear the visual and must not open a page.
      await touch('touchCancel', [])
      await page.waitForTimeout(1100)
      const cancelled = await page.screenshot({ scale: 'css' })
      expect(await changedUnderlineSamples(page, before, cancelled, line)).toBeLessThan(8)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      // A drag that returns to its starting pixel must still not act as a tap.
      await touch('touchStart', [center])
      await touch('touchMove', [{ x: center.x + 30, y: center.y }])
      await touch('touchMove', [center])
      await touch('touchEnd', [])
      await page.waitForTimeout(1100)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      // A second finger cancels the face selection; a pinch must not navigate.
      await touch('touchStart', [center])
      await touch('touchStart', [center, { x: center.x + 25, y: center.y }])
      await touch('touchEnd', [])
      await page.waitForTimeout(1100)
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await touch('touchStart', [center])
      await touch('touchEnd', [])
      await expect(page.getByRole('dialog')).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
      await page.getByRole('button', { name: 'Close projects' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10000 })
      await page.waitForTimeout(profile.reduced ? 150 : 1500)
      expect(await page.locator('.cube-entrance > div').evaluate(element => getComputedStyle(element).filter)).toBe('blur(0px)')
      expect(errors).toEqual([])
    })
  })
}
