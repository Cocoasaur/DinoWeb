import { expect, test } from '@playwright/test'

test.use({ serviceWorkers: 'block' })

for (const profile of [
  { name: 'desktop blue', width: 1440, height: 900, dark: true },
  { name: 'phone light', width: 390, height: 844, touch: true },
]) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.touch, hasTouch: !!profile.touch })
  test('styles the HTML loader before the entry module can arrive', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    await page.addInitScript(dark => localStorage.setItem('dinoweb-theme-v2', dark ? 'demain-soir-bleu' : 'clair-obscur'), !!profile.dark)
    let release
    const gate = new Promise(resolve => { release = resolve })
    await page.route('**/assets/index-*.js', async route => { await gate; await route.continue() })
    try {
      await page.goto('./', { waitUntil: 'commit' })
      const boot = page.locator('#portfolio-boot-shell')
      await expect(boot).toBeVisible()
      const box = await boot.boundingBox()
      expect(box).toEqual({ x: 0, y: 0, width: profile.width, height: profile.height })
      const icon = await boot.locator('img').boundingBox()
      expect(Math.abs(icon.x + icon.width / 2 - profile.width / 2)).toBeLessThan(2)
      await expect(boot).toHaveCSS('background-color', profile.dark ? 'rgb(0, 36, 81)' : 'rgb(242, 242, 242)')
      await boot.screenshot({ path: testInfo.outputPath('immediate-html-loader.png') })
    } finally { release() }
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 60000 })
  })
})

test('holds the loader for a delayed document even after the cube is mounted', async ({ page }, testInfo) => {
  test.setTimeout(60000)
  let release, requested = false
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/assets/John_Arquesola_Resume-*.pdf', async route => { requested = true; await gate; await route.continue() })
  try {
    await page.goto('./', { waitUntil: 'domcontentloaded' })
    await expect.poll(() => requested).toBe(true)
    await expect(page.locator('.cube-entrance canvas')).toHaveCount(1, { timeout: 20000 })
    await expect(page.locator('.boot-screen')).toBeVisible()
    await expect(page.locator('.portfolio-viewport__stage')).toHaveAttribute('inert', '')
    const percent = Number(await page.getByRole('progressbar', { name: 'Portfolio assets' }).getAttribute('aria-valuenow'))
    expect(percent).toBeGreaterThan(0)
    expect(percent).toBeLessThan(100)
    await page.screenshot({ path: testInfo.outputPath('waiting-for-resume.png') })
  } finally { release() }
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 60000 })
  await expect(page.locator('.portfolio-viewport__stage')).not.toHaveAttribute('inert')
})

test('waits for fonts as well as page images and modules', async ({ page }) => {
  test.setTimeout(60000)
  let release, requested = false
  const gate = new Promise(resolve => { release = resolve })
  await page.route('**/assets/inter-latin-700-normal-*.woff2', async route => { requested = true; await gate; await route.continue() })
  try {
    await page.goto('./', { waitUntil: 'domcontentloaded' })
    await expect.poll(() => requested).toBe(true)
    await expect(page.locator('.boot-screen')).toBeVisible()
    expect(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeLessThan(100)
  } finally { release() }
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 60000 })
  expect(await page.evaluate(() => document.fonts.check('700 16px Inter'))).toBe(true)
})

test('keeps failed downloads visible and retries before claiming readiness', async ({ page }, testInfo) => {
  test.setTimeout(60000)
  await page.route('**/assets/John_Arquesola_Resume-*.pdf', route => route.abort('failed'))
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Retry loading', exact: true })).toBeVisible({ timeout: 30000 })
  await expect(page.locator('[data-boot-status]')).toContainText('assets couldn’t load')
  expect(Number(await page.getByRole('progressbar').getAttribute('aria-valuenow'))).toBeLessThan(100)
  await page.screenshot({ path: testInfo.outputPath('asset-retry.png') })
  await page.unroute('**/assets/John_Arquesola_Resume-*.pdf')
  await page.getByRole('button', { name: 'Retry loading', exact: true }).click()
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 60000 })
})

test('completes every listed local asset on repeated reloads without a top-left flash', async ({ page }) => {
  test.setTimeout(90000)
  await page.addInitScript(() => {
    window.bootPositions = []
    const sample = () => {
      const shell = document.getElementById('portfolio-boot-shell')
      if (shell) {
        const rect = shell.getBoundingClientRect()
        window.bootPositions.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })
        requestAnimationFrame(sample)
      } else if (!document.querySelector('.portfolio-viewport')) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  for (let pass = 0; pass < 3; pass++) {
    const finished = new Set()
    const capture = request => finished.add(new URL(request.url()).pathname)
    page.on('requestfinished', capture)
    if (pass) await page.reload(); else await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 60000 })
    const manifest = await page.locator('#portfolio-preload-manifest').textContent()
    const expected = JSON.parse(manifest)
    expect(expected.length).toBeGreaterThan(100)
    expect(expected.some(url => url.includes('/spline/'))).toBe(false)
    await expect.poll(() => expected.filter(url => !finished.has(url))).toEqual([])
    const positions = await page.evaluate(() => ({ frames: window.bootPositions, width: innerWidth, height: innerHeight }))
    expect(positions.frames.length).toBeGreaterThan(0)
    expect(positions.frames.every(rect => rect.x === 0 && rect.y === 0 && rect.width === positions.width && rect.height === positions.height)).toBe(true)
    page.off('requestfinished', capture)
  }
})
