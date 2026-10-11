import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const viewports = [
  [320, 568], [375, 667], [390, 844], [430, 800], [527, 497], [567, 400], [568, 400],
  [661, 695], [695, 661], [767, 900], [768, 768], [768, 1024], [820, 1180],
  [960, 1440], [1023, 1024], [1024, 990], [1024, 768], [1280, 800],
  [1440, 900], [1920, 1080], [1080, 1920], [844, 390],
]
const profiles = [
  { name: 'desktop worker' },
  { name: 'touch worker', touch: true },
  { name: 'desktop fallback', fallback: true },
  { name: 'throttled low-end fallback', touch: true, low: true, fallback: true },
]

function cubeBounds(width, height, rect) {
  const layout = getHomeViewportLayout(width, height)
  const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100)
  camera.position.z = 5; camera.updateMatrixWorld()
  const rotation = new THREE.Euler(-20 * Math.PI / 180, -45 * Math.PI / 180, 0)
  const points = []
  for (const x of [-1.03, 1.03]) for (const y of [-1.03, 1.03]) for (const z of [-1.03, 1.03]) {
    const p = new THREE.Vector3(x, y, z).applyEuler(rotation).multiplyScalar(layout.cubeScale)
      .add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
    points.push({ x: rect.left + (p.x + 1) / 2 * rect.width, y: rect.top + (1 - p.y) / 2 * rect.height })
  }
  return { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)),
    top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) }
}

for (const profile of profiles) test.describe(profile.name, () => {
  test.use({ viewport: { width: 430, height: 800 }, isMobile: !!profile.touch,
    hasTouch: !!profile.touch, serviceWorkers: 'block' })
  test('keeps branding, cube and chrome clear across viewport and orientation boundaries', async ({ page }, testInfo) => {
    test.setTimeout(120000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
      if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu')
    }, profile)
    if (profile.low) {
      const session = await page.context().newCDPSession(page)
      await session.send('Emulation.setCPUThrottlingRate', { rate: 6 })
    }
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    await expect(page.locator('.portfolio-viewport')).toHaveAttribute('data-brand-intro-complete', 'true')
    const renderer = await page.locator('.cube-entrance').getAttribute('data-renderer')
    expect(renderer === 'worker').toBe(!profile.fallback)
    await page.evaluate(() => { window.__homeCanvas = document.querySelector('.cube-entrance canvas') })
    const samples = []
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height })
      await expect(page.locator('.portfolio-viewport')).toHaveCSS('height', `${height}px`)
      await page.waitForTimeout(profile.low ? 800 : 650)
      const ui = await page.evaluate(() => {
        const rect = selector => {
          const el = document.querySelector(selector)
          if (!el) return { visible: false }
          const r = el.getBoundingClientRect()
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height,
            visible: getComputedStyle(el).display !== 'none' && r.height > 0 && (r.width > 0 || selector === '.scrubber-entrance') }
        }
        const parts = ['.mobile-branding__dino', '.mobile-branding__web', '.mobile-branding__version', '.mobile-branding__den'].map(rect)
        const paintedParts = ['.mobile-branding__dino', '.mobile-branding__web', '.mobile-branding__version', '.mobile-branding__den'].map(selector => {
          const el = document.querySelector(selector)
          if (el instanceof SVGSVGElement) {
            const glyphs = el.getBBox(), matrix = el.getScreenCTM()
            const a = new DOMPoint(glyphs.x, glyphs.y).matrixTransform(matrix)
            const b = new DOMPoint(glyphs.x + glyphs.width, glyphs.y + glyphs.height).matrixTransform(matrix)
            return { left: a.x, right: b.x }
          }
          const range = document.createRange()
          range.selectNodeContents(el)
          const text = range.getBoundingClientRect()
          return { left: text.left, right: text.right }
        })
        return { header: rect('.home-coordinate'), theme: rect('.home-theme-label'), footer: rect('.home-footer'),
          parts,
          paintedBrand: { left: Math.min(...paintedParts.map(p => p.left)), right: Math.max(...paintedParts.map(p => p.right)) },
          footerItems: [...document.querySelectorAll('.home-footer__item')].map(el => {
            const r = el.getBoundingClientRect(); return { left: r.left, right: r.right }
          }),
          sidebar: rect('.sidebar-home'), scrubber: rect('.scrubber-entrance'), cue: rect('.rotate-prompt'), canvas: rect('.cube-entrance canvas'),
          brand: { left: Math.min(...parts.map(p => p.left)), right: Math.max(...parts.map(p => p.right)),
            top: Math.min(...parts.map(p => p.top)), bottom: Math.max(...parts.map(p => p.bottom)) },
          fonts: ['.home-coordinate__value', '.home-theme-label__value'].map(s => getComputedStyle(document.querySelector(s)).fontSize),
          sameCanvas: window.__homeCanvas === document.querySelector('.cube-entrance canvas'),
          overflow: document.documentElement.scrollWidth > innerWidth,
        }
      })
      const cube = cubeBounds(width, height, ui.canvas)
      samples.push({ width, height, cube, ui })
      const label = `${profile.name} ${width}x${height}`
      expect(ui.sameCanvas, label).toBe(true)
      expect(ui.scrubber.visible, label).toBe(!profile.touch && width >= 1024)
      expect(ui.overflow, label).toBe(false)
      expect(ui.fonts[0], label).toBe(ui.fonts[1])
      expect(Math.abs(ui.header.left - (width - ui.theme.right)), label).toBeLessThan(1)
      expect(Math.abs(ui.header.left - ui.footer.left), label).toBeLessThan(1)
      expect(Math.abs(width - ui.theme.right - (width - ui.footer.right)), label).toBeLessThan(1)
      expect(ui.header.right + 4, label).toBeLessThan(ui.theme.left)
      expect(ui.footerItems[0].right + 8, label).toBeLessThan(ui.footerItems[1].left)
      expect(ui.footerItems[1].right, label).toBeLessThanOrEqual(width - ui.footer.left + 1)
      if (height >= width) {
        expect(ui.sidebar.visible, label).toBe(false)
        expect(ui.cue.visible, label).toBe(true)
        expect(Math.abs((ui.brand.left + ui.brand.right) / 2 - width / 2), label).toBeLessThan(2)
        // Preserve the reference's staggered arrangement and center its
        // complete painted group, including the two supporting captions.
        expect(Math.abs((ui.paintedBrand.left + ui.paintedBrand.right) / 2 - width / 2), label).toBeLessThan(1)
        const [dino, web, version, den] = ui.parts
        expect(version.left, label).toBeGreaterThan(dino.right + 8)
        expect(version.top, label).toBeGreaterThanOrEqual(dino.top)
        expect(version.bottom, label).toBeLessThan(web.top - 6)
        expect(web.top, label).toBeGreaterThan(dino.bottom + 4)
        expect(web.left, label).toBeGreaterThan(dino.left + dino.width / 2)
        expect(den.right, label).toBeLessThan(web.left - 8)
        expect(den.top, label).toBeGreaterThan(web.top + 8)
        expect(den.bottom, label).toBeLessThan(web.bottom - 8)
        expect(ui.brand.left, label).toBeGreaterThanOrEqual(ui.header.left)
        expect(ui.brand.right, label).toBeLessThanOrEqual(width - ui.header.left)
        expect(ui.brand.top, label).toBeGreaterThan(ui.header.bottom + 12)
        expect(cube.top, label).toBeGreaterThan(ui.brand.bottom + 8)
        expect(cube.bottom, label).toBeLessThan(ui.cue.top - 8)
      } else {
        expect(ui.sidebar.visible, label).toBe(true)
        expect(ui.cue.visible, label).toBe(false)
        expect(Math.abs(ui.sidebar.left - ui.header.left), label).toBeLessThan(1)
        expect(cube.left, label).toBeGreaterThan(ui.sidebar.right + 8)
        expect(ui.sidebar.top, label).toBeGreaterThan(ui.header.bottom + 12)
        expect(ui.sidebar.bottom, label).toBeLessThan(ui.footer.top - 12)
      }
      expect(cube.left, label).toBeGreaterThan(ui.header.left - 8)
      expect(cube.right, label).toBeLessThan(width - ui.header.left + 8)
      expect(cube.top, label).toBeGreaterThan(ui.header.bottom + 8)
      expect(cube.bottom, label).toBeLessThan(ui.footer.top - 8)
      if (['375x667', '768x1024', '661x695', '527x497', '960x1440', '1440x900'].includes(`${width}x${height}`)) {
        await page.screenshot({ path: testInfo.outputPath(`aligned-${width}x${height}.png`), scale: 'css' })
      }
    }
    await testInfo.attach('viewport alignment', { body: JSON.stringify(samples), contentType: 'application/json' })
    expect(errors).toEqual([])
  })
})
