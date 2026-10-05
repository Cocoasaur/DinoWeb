import { expect, test } from '@playwright/test'

test('loads the portfolio home page', async ({ page }) => {
  await page.goto('./')

  await expect(page).toHaveTitle('DinoWeb')
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('.portfolio-viewport')).toBeVisible()
  await expect(page.getByLabel('DINOWEB').first()).toBeVisible()
})
