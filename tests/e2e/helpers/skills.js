import { expect } from '@playwright/test'
import * as THREE from 'three'
import { getHomeViewportLayout } from '../../../src/hooks/useHomeViewportLayout.js'

function cubePoint(width, height, local, rx = -20, ry = -45) {
  const layout = getHomeViewportLayout(width, height)
  const camera = new THREE.PerspectiveCamera(45, width / height, .1, 100)
  camera.position.z = 5
  camera.updateMatrixWorld()
  const point = new THREE.Vector3(...local)
    .applyEuler(new THREE.Euler(rx * Math.PI / 180, ry * Math.PI / 180, 0))
    .multiplyScalar(layout.cubeScale)
    .add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
  return { x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 }
}

export async function openSkills(page, profile) {
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
  const origin = cubePoint(profile.width, profile.height, [0, 0, 0])
  await page.mouse.move(origin.x, origin.y)
  await page.mouse.down()
  await page.mouse.move(origin.x + (135 * Math.PI / 180) / .008, origin.y + (20 * Math.PI / 180) / .008, { steps: 30 })
  await page.mouse.up()
  await expect.poll(async () => {
    const coords = (await page.locator('.home-coordinate').textContent()).match(/X:\s*([\d.-]+),?\s*Y:\s*([\d.-]+)/)
    return !!coords && Math.abs(Number(coords[1])) < 2 && Math.abs(Number(coords[2]) - 90) < 2
  }).toBe(true)
  const face = cubePoint(profile.width, profile.height, [-1.01, 0, 0], 0, 90)
  await page.mouse.click(face.x, face.y)
  await expect(page.getByRole('dialog', { name: 'skills details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
  return face
}


export async function openAbout(page, profile) {
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
  const origin = cubePoint(profile.width, profile.height, [0, 0, 0])
  await page.mouse.move(origin.x, origin.y)
  await page.mouse.down()
  await page.mouse.move(origin.x + Math.PI / 4 / .008, origin.y + (110 * Math.PI / 180) / .008, { steps: 30 })
  await page.mouse.up()
  await expect.poll(async () => {
    const coords = (await page.locator('.home-coordinate').textContent()).match(/X:\s*([\d.-]+),?\s*Y:\s*([\d.-]+)/)
    return !!coords && Math.abs(Number(coords[1]) - 90) < 2 && Math.abs(Number(coords[2])) < 2
  }).toBe(true)
  const face = cubePoint(profile.width, profile.height, [0, 1.01, 0], 90, 0)
  await page.mouse.click(face.x, face.y)
  await expect(page.getByRole('dialog', { name: 'about details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
  return face
}


export async function openProjects(page, profile) {
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
  const face = cubePoint(profile.width, profile.height, [1.01, 0, 0])
  await page.mouse.click(face.x, face.y)
  await expect(page.getByRole('dialog', { name: 'projects details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
  return face
}


export async function openContacts(page, profile) {
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
  await page.locator('.cube-breath').evaluate(el => el.getAnimations().forEach(animation => animation.pause()))
  const readRotation = async () => {
    const coords = (await page.locator('.home-coordinate').textContent()).match(/X:\s*([\d.-]+),?\s*Y:\s*([\d.-]+)/)
    return { x: Number(coords[1]), y: Number(coords[2]) }
  }
  const origin = cubePoint(profile.width, profile.height, [0, 0, 0])
  // Short drags fit narrow viewports; read the rendered pose before each one.
  for (let step = 0; step < 5; step++) {
    const before = await readRotation()
    const dx = Math.max(-120, Math.min(120, (-180 - before.y) * Math.PI / 180 / .008))
    const dy = -before.x * Math.PI / 180 / .008
    if (Math.abs(before.x) < 2 && Math.abs(before.y + 180) < 2) break
    await page.mouse.move(origin.x, origin.y)
    await page.mouse.down()
    await page.mouse.move(origin.x + dx, origin.y + dy, { steps: 20 })
    await page.mouse.up()
    const target = { x: 0, y: before.y + dx * .008 * 180 / Math.PI }
    await expect.poll(async () => {
      const current = await readRotation()
      return Math.abs(current.x - target.x) < 2 && Math.abs(current.y - target.y) < 2
    }).toBe(true)
  }
  const face = cubePoint(profile.width, profile.height, [0, 0, -1.01], 0, 180)
  await page.mouse.click(face.x, face.y)
  await expect(page.getByRole('dialog', { name: 'contacts details' })).toHaveAttribute('data-phase', 'open', { timeout: 15000 })
  return face
}
