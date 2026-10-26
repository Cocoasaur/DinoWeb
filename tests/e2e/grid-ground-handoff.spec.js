import { expect, test } from '@playwright/test'

for (const profile of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'tablet', width: 820, height: 1180, touch: true },
]) for (const theme of ['clair-obscur', 'demain-soir-bleu']) test.describe(`${profile.name} ${theme}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, serviceWorkers: 'block' })

  test('keeps the wall grid above the ground without losing its upper lines', async ({ page }, testInfo) => {
    await page.addInitScript(theme => localStorage.setItem('dinoweb-theme-v2', theme), theme)
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    const mask = page.locator('.home-grid-palette')
    await expect(mask).toHaveCSS('mask-image', /72%/)
    await page.mouse.move(profile.width - 5, 5)
    await page.waitForTimeout(950)
    const alignment = await mask.evaluate(el => {
      const actual = el.getBoundingClientRect(), viewport = el.closest('.home-grid-wipe').getBoundingClientRect()
      return Math.abs(actual.x - viewport.x) + Math.abs(actual.y - viewport.y)
    })
    expect(alignment, 'wall fade stays fixed while its grids move').toBeLessThan(1)
    await page.screenshot({ path: testInfo.outputPath('grid-composition.png') })
    // Isolate wallpaper paint so perspective lines, lettering and cube pixels
    // cannot hide a flat-grid leak in the lower part of the viewport.
    await page.addStyleTag({ content: '.home-stage-backdrop, .home-sidebar-wipe, .home-chrome, .cube-entrance, .scrubber-entrance, .rotate-prompt { visibility: hidden !important; }' })
    const png = await page.screenshot({ scale: 'css' })
    const colors = await page.evaluate(async ({ png, theme }) => {
      const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0)
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
      const base = theme === 'clair-obscur' ? [242,242,242] : [0,36,81]
      let lowerInk = 0, upperInk = 0
      for (let y = 0; y < canvas.height; y += 2) for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4
        const delta = Math.max(...base.map((v,c) => Math.abs(pixels[offset+c] - v)))
        if (y > canvas.height * .8 && delta > 1) lowerInk++
        if (y > canvas.height * .08 && y < canvas.height * .35 && delta > 2) upperInk++
      }
      return { lowerInk, upperInk }
    }, { png: png.toString('base64'), theme })
    expect(colors.lowerInk, 'wallpaper is absent underneath the perspective floor').toBe(0)
    expect(colors.upperInk, 'upper wallpaper remains visible').toBeGreaterThan(40)
  })
})
