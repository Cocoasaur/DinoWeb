import { expect, test } from '@playwright/test'
import { Buffer } from 'node:buffer'
import * as THREE from 'three'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

// Keep fixture requests out of the production service worker's precache.
test.use({ serviceWorkers: 'block' })

const profiles = [
  { name: 'phone', width: 430, height: 800, mobile: true, cores: 8, memory: 8, cap: 4_000_000 },
  { name: 'tablet', width: 820, height: 1180, mobile: true, cores: 8, memory: 8, cap: 4_000_000 },
  { name: 'low-end phone', width: 430, height: 800, mobile: true, cores: 2, memory: 2, cap: 2_000_000 },
]


// Four simple pages exercise offscreen canvas release; the bundled CV has one page.
function multipagePdf() {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count 4 /Kids [4 0 R 6 0 R 8 0 R 10 0 R] >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  for (let i = 0; i < 4; i++) {
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`)
    const content = `BT /F1 24 Tf 72 700 Td (Document preview page ${i + 1}) Tj ET`
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
  }
  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, i) => { offsets.push(pdf.length); pdf += `${i + 1} 0 obj\n${object}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n` })
  return Buffer.from(pdf + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`)
}

function screenPoint(width, height, local, rx = -20, ry = -45) {
  const layout = getHomeViewportLayout(width, height)
  const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100)
  camera.position.z = 5
  camera.updateMatrixWorld()
  const p = new THREE.Vector3(...local).applyEuler(new THREE.Euler(rx * Math.PI / 180, ry * Math.PI / 180, 0))
    .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2 }
}

async function loadHome(page, profile) {
  await page.addInitScript(({ cores, memory }) => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores })
    Object.defineProperty(navigator, 'deviceMemory', { get: () => memory })
  }, profile)
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
}

for (const profile of profiles) {
  test.describe(profile.name, () => {
    test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 })
    test('fits sharp PDFs, bounds zoom allocations, and releases distant pages', async ({ page }, testInfo) => {
      test.setTimeout(90000)
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.route('**/*Curriculum_Vitae*.pdf', route => route.fulfill({ contentType: 'application/pdf', body: multipagePdf() }))
      await loadHome(page, profile)
      const origin = screenPoint(profile.width, profile.height, [0, 0, 0])
      await page.mouse.move(origin.x, origin.y)
      await page.mouse.down()
      await page.mouse.move(origin.x + Math.PI / 4 / .008, origin.y + (110 * Math.PI / 180) / .008, { steps: 30 })
      await page.mouse.up()
      await expect.poll(async () => {
        const coords = (await page.locator('.home-coordinate').textContent()).match(/X: ([\d.-]+), Y: ([\d.-]+)/)
        return Math.abs(Number(coords[1]) - 90) < 2 && Math.abs(Number(coords[2])) < 2
      }).toBe(true)
      const face = screenPoint(profile.width, profile.height, [0, 1.01, 0], 90, 0)
      await page.mouse.click(face.x, face.y)
      await expect(page.getByRole('dialog')).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
      await expect(page.locator('.void-grid-drift')).toHaveCSS('animation-play-state', 'paused')
      await page.locator('.about-cv-viewer').scrollIntoViewIfNeeded()
      const first = page.locator('.about-cv-page-wrap').first()
      const canvas = first.locator('canvas')
      const measure = () => canvas.evaluate(el => ({ pixels: el.width * el.height, ratio: el.width / el.clientWidth, width: el.clientWidth }))
      const ready = async () => {
        await expect(canvas).toBeVisible({ timeout: 30000 })
        await expect(first).toHaveAttribute('aria-busy', 'false')
      }
      await ready()
      const initial = await measure()
      await page.getByRole('tab', { name: 'Résumé', exact: true }).click()
      await ready()
      await expect(page.locator('#document-preview-panel')).toHaveAttribute('aria-busy', 'false')
      expect(initial.ratio).toBeGreaterThan(2)
      expect(initial.pixels).toBeLessThanOrEqual(profile.cap)
      const available = await page.locator('.about-cv-page-stack').evaluate(el => el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) * 2)
      expect(initial.width).toBeLessThanOrEqual(available)
      await testInfo.attach('sharp resume', { body: await page.locator('.about-cv-viewer').screenshot(), contentType: 'image/png' })
      await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
      await expect.poll(async () => (await measure()).width).toBeGreaterThan(initial.width)
      await ready()
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Zoom in', exact: true }).click()
      await expect(page.locator('.about-cv-zoom-level')).toHaveText('200%')
      await expect.poll(async () => (await measure()).width).toBeCloseTo(initial.width * 2, 0)
      await ready()
      expect((await measure()).pixels).toBeLessThanOrEqual(profile.cap)
      await page.getByRole('tab', { name: 'Curriculum Vitae', exact: true }).click()
      await expect(page.locator('.about-cv-zoom-level')).toHaveText('100%')
      const pages = page.locator('.about-cv-page-wrap')
      await expect(pages).toHaveCount(4)
      await ready()
      expect((await measure()).ratio).toBeGreaterThan(2)
      await page.locator('.about-cv-scroll').evaluate(el => { el.scrollTop = el.scrollHeight })
      await expect(pages.last().locator('canvas')).toBeVisible()
      await expect(pages.last()).toHaveAttribute('aria-busy', 'false')
      if (await pages.count() > 2) await expect(first.locator('canvas')).toHaveCount(0)
      await page.setViewportSize({ width: profile.width + 140, height: profile.height })
      await page.locator('.about-cv-scroll').evaluate(el => { el.scrollTop = 0 })
      await ready()
      expect((await measure()).pixels).toBeLessThanOrEqual(profile.cap)
      await page.getByRole('tab', { name: 'Résumé', exact: true }).click()
      await page.getByRole('tab', { name: 'Curriculum Vitae', exact: true }).click()
      await expect(pages).toHaveCount(4)
      await ready()
      await page.getByRole('button', { name: 'Close about details' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 10000 })
      await expect(page.locator('.void-grid-drift')).toHaveCSS('animation-play-state', 'running')
      expect(errors).toEqual([])
    })
  })
}

for (const fallback of [false, true]) {
  test(`actual ${fallback ? 'fallback' : 'worker'} WebGL context has multisample anti-aliasing`, async ({ page }) => {
    await page.addInitScript(fallback => {
      window.__quality = []
      if (fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      const NativeWorker = window.Worker
      window.Worker = class extends NativeWorker {
        constructor(...args) {
          super(...args)
          this.addEventListener('message', ({ data }) => { if (data.type === 'quality-probe') window.__quality.push(data) })
        }
      }
      const native = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (...args) {
        const gl = native.apply(this, args)
        if (args[0] === 'webgl2' && gl) window.__quality.push({ antialias: gl.getContextAttributes().antialias, samples: gl.getParameter(gl.SAMPLES) })
        return gl
      }
    }, fallback)
    await page.route('**/cubeRenderer-*.js', async route => {
      const response = await route.fetch()
      const probe = `const nativeContext = OffscreenCanvas.prototype.getContext;
        OffscreenCanvas.prototype.getContext = function(...args) {
          const gl = nativeContext.apply(this,args);
          if(args[0] === 'webgl2' && gl) self.postMessage({type:'quality-probe',antialias:gl.getContextAttributes().antialias,samples:gl.getParameter(gl.SAMPLES)});
          return gl;
        };\n`
      await route.fulfill({ response, body: probe + await response.text() })
    })
    await loadHome(page, { cores: 8, memory: 8 })
    expect(await page.evaluate(() => window.__quality.some(q => q.antialias && q.samples > 0))).toBe(true)
  })
}

for (const dark of [false, true]) {
  test(`mobile ${dark ? 'blue' : 'light'} theme matches desktop body shading`, async ({ browser }) => {
    const shades = []
    for (const mobile of [false, true]) {
      const width = mobile ? 430 : 1440, height = mobile ? 800 : 900
      const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 })
      const page = await context.newPage()
      if (dark) await page.addInitScript(() => localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu'))
      await loadHome(page, { cores: 8, memory: 8 })
      await expect(page.locator('html')).toHaveAttribute('data-theme', dark ? 'demain-soir-bleu' : 'clair-obscur')
      const points = [[.8, .65, 1.01], [1.01, .6, .3], [0, -1.01, .5]].map(p => screenPoint(width, height, p))
      const png = (await page.screenshot({ scale: 'css' })).toString('base64')
      shades.push(await page.evaluate(async ({ png, points }) => {
        const img = new Image(); img.src = `data:image/png;base64,${png}`; await img.decode()
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0)
        return points.map(p => Array.from(ctx.getImageData(Math.round(p.x), Math.round(p.y), 1, 1).data).slice(0, 3))
      }, { png, points }))
      await context.close()
    }
    for (let face = 0; face < 3; face++) {
      for (let channel = 0; channel < 3; channel++) expect(Math.abs(shades[0][face][channel] - shades[1][face][channel])).toBeLessThan(20)
    }
  })
}
