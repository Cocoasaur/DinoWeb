import { expect } from '@playwright/test'

export async function assertPinnedHeader(page, panel, testInfo) {
  const name = await panel.getAttribute('data-page')
  const frame = page.locator(`.portfolio-overlay-frame[data-page="${name}"]`)
  const header = frame.locator('.portfolio-overlay-masthead')
  const close = page.getByRole('button', { name: `Close ${name} details` })
  const id = await panel.getAttribute('id')
  const rail = page.locator(`[role="scrollbar"][aria-controls="${id}"][aria-orientation="vertical"]`)
  const custom = await panel.getAttribute('data-scrollbars') === 'custom'
  const previous = await panel.evaluate(el => el.scrollTop)
  for (const fraction of [0, .5, 1]) {
    await panel.evaluate((el, ratio) => { el.scrollTop = (el.scrollHeight - el.clientHeight) * ratio }, fraction)
    await expect.poll(async () => {
      const frameBox = await frame.boundingBox()
      const panelBox = await panel.boundingBox()
      const headerBox = await header.boundingBox()
      const closeBox = await close.boundingBox()
      const railBox = custom ? await rail.boundingBox() : null
      return Math.abs(headerBox.y - frameBox.y - 1) < 1
        && Math.abs(panelBox.y - headerBox.y - headerBox.height) < 1
        && Math.abs(closeBox.y - headerBox.y) < 1
        && Math.abs(closeBox.y + closeBox.height - headerBox.y - headerBox.height) <= 1
        && (!custom || !!railBox && railBox.y >= headerBox.y + headerBox.height - 1
        && railBox.y + railBox.height <= panelBox.y + panelBox.height)
    }, { message: `${name} masthead and close stay pinned above the scrollbar` }).toBe(true)
    await expect(header).toHaveCSS('opacity', '1')
    const hit = await close.evaluate(el => {
      const box = el.getBoundingClientRect()
      return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2))
    })
    expect(hit).toBe(true)
    if (fraction === .5) await frame.screenshot({ path: testInfo.outputPath('pinned-header.png') })
  }
  // The shortened rail must still address the whole native scroll range.
  if (custom) {
    await rail.focus()
    await page.keyboard.press('Home')
    await expect.poll(() => panel.evaluate(el => el.scrollTop)).toBe(0)
    await page.keyboard.press('End')
    await expect.poll(() => panel.evaluate(el => Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop))).toBeLessThan(2)
  }
  await close.focus()
  await panel.evaluate((el, top) => { el.scrollTop = top }, previous)
}
