import { expect, test } from '@playwright/test'
import { openSkills, openAbout } from './helpers/skills.js'

for (const name of ['about', 'skills']) for (const fallback of [false, true]) {
  test(`preserves the covered ${name} cube across viewport changes (${fallback ? 'fallback' : 'worker'})`, async ({ page }, testInfo) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.addInitScript(fallback => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 })
      if (fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
    }, fallback)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    if (name === 'about') await page.addInitScript(() => localStorage.setItem('dinoweb-theme-v2', 'demain-soir-bleu'))
    await (name === 'about' ? openAbout : openSkills)(page, { width: 1440, height: 900 })
    const stage = page.locator('.cube-entrance')
    await expect(stage).toHaveAttribute('data-render-paused', 'true')
    const coverage = async () => {
      // Inspect actual backing pixels while leaving application state paused.
      const style = await page.addStyleTag({ content: `
        html, body { background: transparent !important; }
        body * { visibility: hidden !important; }
        .cube-entrance canvas { visibility: visible !important; }
        .cube-entrance > div { filter: none !important; transform: none !important; }
      ` })
      try {
        const pixels = await stage.locator('canvas').screenshot({ omitBackground: true, path: testInfo.outputPath(`canvas-${page.viewportSize().width}.png`) })
        return await page.evaluate(async base64 => {
          const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${base64}`)).blob())
          const surface = new OffscreenCanvas(image.width, image.height)
          const ctx = surface.getContext('2d')
          ctx.drawImage(image, 0, 0)
          const data = ctx.getImageData(0, 0, image.width, image.height).data
          let visible = 0
          for (let i = 3; i < data.length; i += 4) if (data[i] > 200) visible++
          image.close()
          return visible / (data.length / 4)
        }, pixels.toString('base64'))
      } finally { await style.evaluate(el => el.remove()) }
    }
    const samples = []
    for (const viewport of [{ width: 393, height: 852 }, { width: 820, height: 1180 }, { width: 1440, height: 900 }]) {
      const beforeDraws = await stage.locator('.cube-breath').getAttribute('data-scene-draws')
      await page.setViewportSize(viewport)
      await expect.poll(() => stage.locator('canvas').evaluate(el => Math.abs(el.width / el.height - innerWidth / innerHeight))).toBeLessThan(.01)
      await expect(stage).toHaveAttribute('data-render-paused', 'true')
      await expect.poll(coverage, { message: 'a resize must not leave a transparent cube buffer behind the page' }).toBeGreaterThan(.8)
      const pixels = await coverage()
      expect(pixels, 'the resized frame must survive compositing during the dissolve').toBeGreaterThan(.8)
      samples.push({ viewport, beforeDraws, coverage: pixels })
      const draws = await stage.locator('.cube-breath').getAttribute('data-scene-draws')
      await page.waitForTimeout(250)
      expect(await stage.locator('.cube-breath').getAttribute('data-scene-draws')).toBe(draws)
    }
    await testInfo.attach('covered canvas pixels', { body: JSON.stringify(samples), contentType: 'application/json' })
    await page.getByRole('button', { name: `Close ${name} details` }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect.poll(() => stage.locator(':scope > div').evaluate(el => getComputedStyle(el).filter)).toBe('blur(0px)')
    expect(errors).toEqual([])
  })
}
