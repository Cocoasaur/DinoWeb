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
  camera.position.z = 5; camera.updateMatrixWorld()
  const rotation = new THREE.Euler(...info.rotation.map(n => n * Math.PI / 180), 0)
  const project = (name, x, y) => {
    const face = FACE_CONFIG.find(f => f.name === name)
    const p = new THREE.Vector3(x, y, .006).applyEuler(new THREE.Euler(...face.rotation))
      .add(new THREE.Vector3(...face.position)).applyEuler(rotation).multiplyScalar(layout.cubeScale)
      .add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
    return { x: info.rect.x + (p.x + 1) / 2 * info.rect.width, y: info.rect.y + (1 - p.y) / 2 * info.rect.height }
  }
  return { click: project('theme', .15, 0), body: [[-.55, .65], [.55, .65], [-.55, -.55], [.55, -.55]].map(([x,y]) => project('projects', x, y)) }
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
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
      if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      const native = document.startViewTransition.bind(document)
      document.startViewTransition = (...args) => {
        const vt = native(...args); window.__wipeTransition = vt
        vt.ready.then(() => {
          const animation = document.getAnimations().find(a => a.animationName === 'theme-circle-expand' || a.animationName === 'theme-circle-shrink')
          animation.pause(); animation.currentTime = 1; window.__wipeAnimation = animation
        }).catch(() => {})
        return vt
      }
    }, profile)
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(a => a.pause()))
    if (profile.fallback) await expect(page.locator('.cube-entrance')).not.toHaveAttribute('data-renderer', 'worker')
    else await expect(page.locator('.cube-entrance')).toHaveAttribute('data-renderer', 'worker')
    for (const theme of ['demain-soir-bleu', 'clair-obscur']) {
      const { click, body } = await points(page)
      if (profile.mobile) await page.touchscreen.tap(click.x, click.y)
      else await page.mouse.click(click.x, click.y)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.waitForFunction(() => window.__wipeAnimation?.playState === 'paused')
      await page.waitForTimeout(350)
      const old = await pixels(page, body)
      await page.screenshot({ path: testInfo.outputPath(`${theme}-old.png`), scale: 'css' })
      await page.evaluate(() => { window.__wipeAnimation.currentTime = 1999 })
      await page.waitForTimeout(200)
      const next = await pixels(page, body)
      await page.screenshot({ path: testInfo.outputPath(`${theme}-new.png`), scale: 'css' })
      const origin = await page.evaluate(() => ({
        x: parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-x')),
        y: parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-y')),
      }))
      const distances = body.map(p => Math.hypot(p.x-origin.x, p.y-origin.y))
      const sorted = [...distances].sort((a,b) => a-b)
      const radius = (sorted[1] + sorted[2]) / 2
      const actualRadius = await page.evaluate(({ radius, expand }) => {
        const root = document.documentElement
        const pseudo = expand ? '::view-transition-new(root)' : '::view-transition-old(root)'
        let low = 1, high = 1999, current
        for (let i = 0; i < 20; i++) {
          const mid = (low + high) / 2; window.__wipeAnimation.currentTime = mid
          current = Number(getComputedStyle(root, pseudo).clipPath.match(/^circle\(([\d.]+)%/)[1]) / 100 * Math.hypot(root.clientWidth,root.clientHeight) / Math.SQRT2
          if ((current < radius) === expand) low = mid; else high = mid
        }
        return current
      }, { radius, expand: theme === 'demain-soir-bleu' })
      await page.waitForTimeout(200)
      const mixed = await pixels(page, body)
      const selections = distances.map(d => (d < actualRadius) === (theme === 'demain-soir-bleu'))
      await testInfo.attach(`${theme} pixel colors`, { body: JSON.stringify({ old, next, mixed, selections, radius: actualRadius, body }), contentType: 'application/json' })
      await page.screenshot({ path: testInfo.outputPath(`${theme}-split-palette.png`), scale: 'css' })
      expect(selections.filter(Boolean)).toHaveLength(2)
      for (let i = 0; i < body.length; i++) {
        expect(Math.abs(old[i][0] - next[i][0]), 'body palettes must visibly differ').toBeGreaterThan(65)
        const expected = selections[i] ? next[i] : old[i]
        for (let c = 0; c < 3; c++) expect(Math.abs(mixed[i][c] - expected[c]), `pixel ${i}, channel ${c}`).toBeLessThan(25)
      }
      await page.evaluate(() => { window.__wipeTransition.skipTransition(); window.__wipeAnimation = null })
      await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/)
      await expect(page.locator('.cube-entrance')).toHaveAttribute('data-cube-theme', theme)
    }
    expect(errors).toEqual([])
  })
})
