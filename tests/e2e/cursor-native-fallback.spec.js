import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

test.use({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })

test('replaces the fallback cube pointer while preserving semantic hints and native restoration', async ({ page }) => {
  await page.addInitScript(() => { HTMLCanvasElement.prototype.transferControlToOffscreen = undefined })
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await expect(page.locator('.cube-entrance')).not.toHaveAttribute('data-renderer', 'worker')
  const layout = getHomeViewportLayout(1440, 900)
  const camera = new THREE.PerspectiveCamera(45, 1440 / 900, .1, 100)
  camera.position.z = 5; camera.updateMatrixWorld()
  const point = new THREE.Vector3(0, 0, 1.01)
    .applyEuler(new THREE.Euler(-20 * Math.PI / 180, -45 * Math.PI / 180, 0))
    .multiplyScalar(layout.cubeScale).add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  await page.mouse.move((point.x + 1) * 720, (1 - point.y) * 450)
  await expect.poll(() => page.locator('.cube-entrance canvas').evaluate(el => el.style.cursor)).toBe('nwse-resize')
  await expect(page.locator('.cube-entrance canvas')).toHaveCSS('cursor', 'none')
  await expect(page.locator('.portfolio-cursor__label')).toHaveText('ZOOM')
  expect(await page.locator('body').evaluate(el => el.style.cursor)).toBe('')
  await page.mouse.move(20, 20)
  await expect.poll(() => page.locator('.cube-entrance canvas').evaluate(el => el.style.cursor)).toBe('auto')
  await expect(page.locator('.cube-entrance canvas')).toHaveCSS('cursor', 'none')
  await expect(page.locator('body')).toHaveCSS('cursor', 'none')
  await page.mouse.move(-5, -5)
  await expect(page.locator('.portfolio-cursor')).toHaveAttribute('data-visible', 'false')
  await expect(page.locator('body')).toHaveCSS('cursor', 'auto')
  await expect(page.locator('.cube-entrance canvas')).toHaveCSS('cursor', 'auto')
})
