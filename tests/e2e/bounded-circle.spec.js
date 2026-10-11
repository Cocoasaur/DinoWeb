import { expect, test } from '@playwright/test'
import { boundedCirclePath } from '../../src/utils/boundedCircle.js'

test('inverse circles match the reveal without painting outside the layer', async ({ page }) => {
  const shapes = []
  for (const [width, height] of [[430, 800], [2536, 1310], [3840, 2160]]) {
    for (const [x, y] of [[width * .7, height * .6], [0, 0], [width, height], [-50, height / 2]]) {
      for (const radius of [10, width * .2, width * .55, width, Math.hypot(width, height) * 1.5]) {
        shapes.push({ x, y, radius, width, height, path: boundedCirclePath(x, y, radius, 0, 0, width, height) })
      }
    }
  }
  const result = await page.evaluate(shapes => {
    const ctx = document.createElement('canvas').getContext('2d')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); document.body.append(svg)
    let mismatches = 0, leaks = 0, oversized = 0, checked = 0
    for (const shape of shapes) {
      const { x, y, radius, width, height, path } = shape
      const element = document.createElementNS(svg.namespaceURI, 'path'); element.setAttribute('d', path); svg.append(element)
      const box = element.getBBox()
      if (box.x < -.001 || box.y < -.001 || box.x + box.width > width + .001 || box.y + box.height > height + .001) oversized++
      element.remove()
      const inverse = new Path2D(`M0 0H${width}V${height}H0Z ${path}`)
      for (let row = -5; row < 55; row++) for (let column = -5; column < 85; column++) {
        const px = (column + .37) * width / 80, py = (row + .61) * height / 50
        const inBox = px >= 0 && py >= 0 && px <= width && py <= height
        const expected = inBox && Math.hypot(px - x, py - y) > radius
        const painted = ctx.isPointInPath(inverse, px, py, 'evenodd')
        checked++; if (painted !== expected) mismatches++
        if (painted && !inBox) leaks++
      }
    }
    return { checked, mismatches, leaks, oversized }
  }, shapes)
  expect(result.checked).toBe(324000)
  expect(result.mismatches).toBe(0)
  expect(result.leaks).toBe(0)
  expect(result.oversized).toBe(0)
})
