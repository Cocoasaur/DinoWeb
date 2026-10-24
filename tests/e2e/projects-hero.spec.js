import { expect, test } from '@playwright/test'
import { openProjects } from './helpers/skills.js'

for (const profile of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 820, height: 1180, touch: true },
  { name: 'phone reduced motion', width: 390, height: 844, touch: true, reduced: true },
]) test.describe(`Projects introduction: ${profile.name}`, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, hasTouch: !!profile.touch,
    isMobile: !!profile.touch, reducedMotion: profile.reduced ? 'reduce' : 'no-preference', serviceWorkers: 'block' })

  test('fills the hero with its introduction and preserves collection navigation', async ({ page }, testInfo) => {
    test.setTimeout(60000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await openProjects(page, profile)
    const hero = page.locator('.projects-hero')
    const copy = hero.locator('.projects-hero-copy')
    await expect(copy.getByRole('heading', { name: 'Ideas, made real.' })).toBeVisible()
    await expect(page.getByRole('region', { name: 'Project showcase' })).toHaveCount(0)
    await expect(hero.locator('img, .projects-specimen')).toHaveCount(0)
    const bounds = await hero.boundingBox(), content = await copy.boundingBox()
    expect(Math.abs(bounds.width - content.width)).toBeLessThan(1)
    await expect(page.locator('.projects-card')).toHaveCount(5)
    await hero.screenshot({ path: testInfo.outputPath('projects-introduction.png') })
    await copy.getByRole('button', { name: 'Explore work' }).click()
    const search = page.getByRole('searchbox', { name: 'Search projects' })
    await expect(search).toBeInViewport()
    await search.fill('Quarto')
    const project = page.getByRole('button', { name: 'Open Quarto project', exact: true })
    await project.scrollIntoViewIfNeeded()
    await expect(page.locator('.projects-card-face')).toHaveCSS('opacity', '1')
    if (profile.touch) await project.tap(); else await project.click()
    await expect(page.locator('.project-modal-title')).toHaveText('Quarto')
    await expect(page.locator('.project-gallery')).toBeVisible()
    await page.getByRole('button', { name: 'Back to projects', exact: true }).click()
    await expect(search).toHaveValue('Quarto')
    await expect(page.locator('.portfolio-overlay-panel')).toHaveJSProperty('scrollWidth', await page.locator('.portfolio-overlay-panel').evaluate(el => el.clientWidth))
    expect(errors).toEqual([])
  })
})
