import { expect, test } from '@playwright/test'
import * as THREE from 'three'
import { FACE_CONFIG } from '../../src/constants/cubeConfig.js'
import { getHomeViewportLayout } from '../../src/hooks/useHomeViewportLayout.js'

const profiles = [
  { name: 'desktop worker', width: 1440, height: 900 },
  { name: 'recorded high-DPR desktop', width: 2536, height: 1310, dpr: 2 },
  { name: 'phone worker', width: 430, height: 800, mobile: true },
  { name: 'low-end phone', width: 430, height: 800, mobile: true, low: true },
  { name: 'desktop fallback', width: 1440, height: 900, fallback: true },
  { name: 'phone fallback', width: 430, height: 800, mobile: true, fallback: true },
  { name: 'throttled low-end fallback', width: 430, height: 800, mobile: true, fallback: true, low: true, throttle: true },
]

async function points(page) {
  const info = await page.locator('.cube-entrance canvas').evaluate(canvas => ({
    width: canvas.clientWidth, height: canvas.clientHeight,
    rect: { x: canvas.getBoundingClientRect().x, y: canvas.getBoundingClientRect().y,
      width: canvas.getBoundingClientRect().width, height: canvas.getBoundingClientRect().height },
    center: getComputedStyle(document.querySelector('.cube-breath')).transformOrigin.split(' ').map(Number.parseFloat),
    rotation: document.querySelector('.home-coordinate').textContent.match(/X: ([\d.-]+), Y: ([\d.-]+)/).slice(1).map(Number),
  }))
  const layout = getHomeViewportLayout(info.width, info.height)
  const camera = new THREE.PerspectiveCamera(45, info.width / info.height, .1, 100)
  camera.position.z = 5
  const focal = info.height / (2 * Math.tan(Math.PI / 8))
  // Worker breathing pivots publish the actual rendered center, including
  // camera parallax. The fallback pivot is its settled layout center.
  camera.position.x = layout.restingX - (info.center[0] - info.width / 2) * 5 / focal
  camera.position.y = layout.restingY - (info.height / 2 - info.center[1]) * 5 / focal
  camera.updateMatrixWorld()
  const rotation = new THREE.Euler(...info.rotation.map(n => n * Math.PI / 180), 0)
  const project = (name, x, y) => {
    const face = FACE_CONFIG.find(f => f.name === name)
    const p = new THREE.Vector3(x, y, .006).applyEuler(new THREE.Euler(...face.rotation))
      .add(new THREE.Vector3(...face.position)).applyEuler(rotation).multiplyScalar(layout.cubeScale)
      .add(new THREE.Vector3(layout.restingX, layout.restingY, 0)).project(camera)
    return { x: info.rect.x + (p.x + 1) / 2 * info.rect.width, y: info.rect.y + (1 - p.y) / 2 * info.rect.height }
  }
  return { click: project('theme', .15, 0), body: [[-.25, .35], [.25, .35], [-.25, -.35], [.25, -.35]].map(([x,y]) => project('projects', x, y)) }
}


async function capture(page, key) {
  const png = (await page.screenshot({ scale: 'css' })).toString('base64')
  await page.evaluate(async ({ png, key }) => {
    const image = new Image(); image.src = 'data:image/png;base64,' + png; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0)
    window.__gridPixels ||= {}; window.__gridPixels[key] = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  }, { png, key })
}

for (const profile of profiles) test.describe(profile.name, () => {
  test.use({ viewport: { width: profile.width, height: profile.height }, isMobile: !!profile.mobile,
    hasTouch: !!profile.mobile, deviceScaleFactor: profile.dpr || 1, serviceWorkers: 'block' })
  test('reveals background and ground line pixels with the actual circle in both directions', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(profile => {
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'deviceMemory', { get: () => profile.low ? 2 : 8 })
      Object.defineProperty(navigator, 'connection', { get: () => ({ effectiveType: '4g', saveData: false }) })
      if (profile.fallback) HTMLCanvasElement.prototype.transferControlToOffscreen = undefined
      window.addEventListener('theme-wipe-start', e => {
        const animation = e.detail.animation
        animation.pause(); animation.currentTime = 1; window.__gridAnimation = animation
      })
    }, profile)
    if (profile.throttle) await (await page.context().newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 6 })
    await page.goto('./')
    await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 30000 })
    // Exclude translucent cube tick/edge pixels that can resemble a faint
    // grid line. The cube's spatial palette is tested by cube-wipe.spec.js.
    const isolateGrids = await page.addStyleTag({ content: '.cube-entrance canvas { visibility: hidden !important; }' })
    await isolateGrids.evaluate(el => { el.media = 'not all' })
    // Freeze only the pixel fixture. The existing theme-motion regressions
    // separately check that real grid/floor/breath clocks never stop or replay.
    await page.evaluate(() => {
      for (const a of document.getAnimations()) if (a.animationName === 'drift' || a.effect?.getTiming().iterations === Infinity) a.pause()
      window.__gridNodes = [document.querySelector('.void-grid-drift'), document.querySelector('.home-stage-backdrop__floor')]
    })
    for (const theme of ['demain-soir-bleu', 'clair-obscur']) {
      await isolateGrids.evaluate(el => { el.media = 'not all' })
      const { click } = await points(page)
      if (profile.mobile) await page.touchscreen.tap(click.x, click.y)
      else await page.mouse.click(click.x, click.y)
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.waitForFunction(() => window.__gridAnimation?.playState === 'paused')
      await isolateGrids.evaluate(el => { el.media = 'all' })
      await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(4)
      await expect(page.locator('.home-chrome[data-wipe-palette="new"] .home-theme-label__value')).toHaveText(
        theme === 'demain-soir-bleu' ? 'THEME: DEMAIN_SOIR_BLEU' : 'THEME: CLAIR_OBSCUR')
      expect(await page.locator('[data-wipe-palette="new"] [id]').evaluateAll(nodes => nodes.every(n => document.querySelectorAll(`[id="${n.id}"]`).length === 1))).toBe(true)
      await page.waitForTimeout(profile.mobile ? 400 : 4000)
      await capture(page, 'old')
      await page.evaluate(() => { window.__gridAnimation.currentTime = 1999 })
      await page.waitForTimeout(200)
      await capture(page, 'next')
      const selection = await page.evaluate(theme => {
        const width = innerWidth, height = innerHeight
        const origin = { x: parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-x')),
          y: parseFloat(document.documentElement.style.getPropertyValue('--theme-origin-y')) }
        const oldBase = theme === 'demain-soir-bleu' ? [232,230,225] : [0,36,81]
        const newBase = theme === 'demain-soir-bleu' ? [0,36,81] : [232,230,225]
        const pixel = (data,x,y) => Array.from(data.slice((y*width+x)*4,(y*width+x)*4+3))
        const mark = document.querySelector(innerWidth > innerHeight ? '.sidebar-home__logo' : '.mobile-branding__lockup').getBoundingClientRect()
        const candidates = []
        for (const [kind,minY,maxY] of [['background',70,height*.42], ['ground',height*.75,height-82], ['branding',Math.max(0,mark.top),Math.min(height-3,mark.bottom)]]) {
          const samples = []
          for (let y = Math.ceil(minY); y < maxY; y++) for (let x = 20; x < width-20; x++) {
            const old = pixel(window.__gridPixels.old,x,y), next = pixel(window.__gridPixels.next,x,y)
            const distance = (a,b) => Math.max(...a.map((v,i)=>Math.abs(v-b[i])))
            const a=distance(old,oldBase), b=distance(next,newBase)
            if (kind === 'branding') {
              if (x < mark.left || x > mark.right || a < 60 || b < 60 || distance(old,next) < 65) continue
            } else {
              // Select thin grid lines; exclude lettering and broad glows.
              if (a<4 || a>55 || b<3 || b>55) continue
              if (distance(old,pixel(window.__gridPixels.old,x+2,y))<2 && distance(old,pixel(window.__gridPixels.old,x,y+2))<2) continue
            }
            samples.push({ x,y,old,next,kind,d:Math.hypot(x-origin.x,y-origin.y) })
          }
          candidates.push(samples)
        }
        return { counts:candidates.map(a=>a.length), cases:candidates.map(a=>{
          if (!a.length) return {samples:[]}
          const distances=a.map(p=>p.d).sort((a,b)=>a-b)
          const radius=distances[Math.floor(distances.length/2)]
          const samples=[false,true].flatMap(inside=>{
            const side=a.filter(p=>inside?p.d<radius-10:p.d>radius+10)
            return Array.from({length:Math.min(side.length,10)},(_,i)=>side[Math.floor(i*side.length/Math.min(side.length,10))])
          })
          return {kind:a[0].kind,radius,samples,expand:theme==='demain-soir-bleu'}
        }) }
      },theme)
      expect(selection.counts.every(n=>n>20), 'visible background, ground lines and branding').toBe(true)
      // A phone's floor and wallpaper can sit at disjoint distances from the
      // face-click origin. Test each surface when the circle crosses it.
      for (const surface of selection.cases) {
        expect(surface.samples).toHaveLength(20)
        surface.radius = await page.evaluate(({radius,expand}) => {
          const width=innerWidth,height=innerHeight
          let low=1,high=1999,actual
          for (let i=0;i<20;i++) {
            const mid=(low+high)/2;window.__gridAnimation.currentTime=mid
            actual=1.5*(expand?window.__gridAnimation.effect.getComputedTiming().progress:1-window.__gridAnimation.effect.getComputedTiming().progress)*Math.hypot(width,height)/Math.SQRT2
            if ((actual<radius)===expand) low=mid;else high=mid
          }
          return actual
        },surface)
        await page.waitForTimeout(200)
        await capture(page, 'mixed')
        const result = await page.evaluate(selection => {
          return selection.samples.map(p=>{
            const start=(p.y*innerWidth+p.x)*4, mixed=Array.from(window.__gridPixels.mixed.slice(start,start+3))
            const expected=(p.d<selection.radius)===selection.expand?p.next:p.old
            return { ...p,mixed,expected,error:Math.max(...mixed.map((v,i)=>Math.abs(v-expected[i]))) }
          })
        },surface)
        await testInfo.attach(`${theme} ${surface.kind} grid pixels`, {body:JSON.stringify(result),contentType:'application/json'})
        await isolateGrids.evaluate(el => { el.media = 'not all' })
        await page.screenshot({path:testInfo.outputPath(`${theme}-${surface.kind}-wipe.png`),scale:'css'})
        await isolateGrids.evaluate(el => { el.media = 'all' })
        expect(Math.max(...result.map(p=>p.error)), 'each grid pixel uses the palette on its actual side of the circle').toBeLessThan(5)
      }
      await page.evaluate(() => { window.__gridAnimation.finish(); window.__gridAnimation=null })
      await expect(page.locator('html')).not.toHaveClass(/theme-transitioning/)
      await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(0)
      expect(await page.evaluate(() => window.__gridNodes[0]===document.querySelector('.void-grid-drift') &&
        window.__gridNodes[1]===document.querySelector('.home-stage-backdrop__floor') &&
        [...document.querySelectorAll('.home-grid-palette,.home-stage-backdrop')].every(el=>!el.style.clipPath && !el.style.getPropertyValue('--void-grid')))).toBe(true)
    }
    expect(errors).toEqual([])
  })
})

test('keeps original grid clocks live and removes temporary palette surfaces after completion', async ({ page }, testInfo) => {
  test.setTimeout(30000)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    window.addEventListener('theme-wipe-start', e => {
      const circle = e.detail.animation; window.__gridAnimation = circle
      circle.pause(); circle.currentTime = 500
    })
  })
  await page.goto('./')
  await expect(page.locator('.boot-screen')).toHaveCount(0, { timeout: 20000 })
  await page.evaluate(() => {
    window.__originalDrifts = ['.home-grid-wipe', '.home-stage-backdrop'].map(selector =>
      document.querySelector(selector).getAnimations({ subtree: true }).find(a => a.animationName === 'drift'))
    window.__originalGrid = document.querySelector('.home-grid-wipe')
    window.__originalGridDriftNode = document.querySelector('.void-grid-drift')
    window.__originalFloor = document.querySelector('.home-stage-backdrop__floor')
    window.__originalDriftTimes = window.__originalDrifts.map(animation => animation.currentTime)
  })
  const { click } = await points(page)
  await page.mouse.click(click.x, click.y)
  await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(4)
  await page.mouse.move(1300, 750)
  await page.waitForTimeout(1000)
  const motion = await page.evaluate(() => {
    const grid = window.__originalGrid
    const gridClock = grid.getAnimations({ subtree: true }).find(a => a.animationName === 'drift')
    const surface = document.querySelector('.home-grid-wipe__surface')
    const floor = document.querySelector('.home-stage-backdrop:not([data-wipe-palette])')
    const copiedFloor = document.querySelector('.home-stage-backdrop[data-wipe-palette="new"]')
    const floorClock = floor.getAnimations({ subtree: true }).find(a => a.animationName === 'drift')
    const duplicateFloorClock = copiedFloor.getAnimations({ subtree: true }).find(a => a.animationName === 'drift')
    return {
      grid: {
        sameOriginal: gridClock === window.__originalDrifts[0],
        originalNodeConnected: window.__originalGridDriftNode.isConnected && grid.contains(window.__originalGridDriftNode),
        state: gridClock.playState, elapsed: gridClock.currentTime - window.__originalDriftTimes[0],
        sourceClip: getComputedStyle(grid).clipPath, sourceOpacity: getComputedStyle(grid).opacity,
        surfaceClip: getComputedStyle(surface).clipPath, surfaceOpacity: getComputedStyle(surface).opacity,
        isCanvas: surface instanceof HTMLCanvasElement,
        hasPixels: surface instanceof HTMLCanvasElement && surface.width > 0 && surface.height > 0,
        surfaceCount: document.querySelectorAll('.home-grid-wipe__surface').length,
        duplicateDrifts: surface.getAnimations({ subtree: true }).filter(a => a.animationName === 'drift').length,
      },
      floor: {
        sameOriginal: floorClock === window.__originalDrifts[1],
        originalNodeConnected: window.__originalFloor.isConnected && floor.contains(window.__originalFloor),
        states: [floorClock.playState, duplicateFloorClock.playState],
        elapsed: floorClock.currentTime - window.__originalDriftTimes[1],
        clockDifference: Math.abs(floorClock.currentTime - duplicateFloorClock.currentTime),
        matricesMatch: getComputedStyle(window.__originalFloor).transform ===
          getComputedStyle(copiedFloor.querySelector('.home-stage-backdrop__floor')).transform,
      },
    }
  })
  await testInfo.attach('live palette motion', { body: JSON.stringify(motion), contentType: 'application/json' })
  expect(motion.grid).toMatchObject({ sameOriginal: true, originalNodeConnected: true, state: 'running',
    sourceClip: 'none', sourceOpacity: '0', surfaceClip: 'none', surfaceOpacity: '1',
    isCanvas: true, hasPixels: true, surfaceCount: 1, duplicateDrifts: 0 })
  expect(motion.grid.elapsed).toBeGreaterThan(0)
  expect(motion.floor).toMatchObject({ sameOriginal: true, originalNodeConnected: true,
    states: ['running', 'running'], matricesMatch: true })
  expect(motion.floor.elapsed).toBeGreaterThan(0)
  expect(motion.floor.clockDifference).toBeLessThan(1)
  await page.evaluate(() => window.__gridAnimation.finish())
  await expect(page.locator('[data-wipe-palette="new"]')).toHaveCount(0)
  expect(await page.evaluate(() => [...document.querySelectorAll('.home-grid-palette,.home-stage-backdrop')]
    .every(el => !el.style.clipPath && !el.style.getPropertyValue('--void-grid')))).toBe(true)
  expect(await page.evaluate(() => document.querySelector('.home-grid-wipe') === window.__originalGrid &&
    document.querySelector('.void-grid-drift') === window.__originalGridDriftNode &&
    document.querySelector('.home-stage-backdrop__floor') === window.__originalFloor &&
    !window.__originalGrid.style.opacity && getComputedStyle(window.__originalGrid).opacity === '1' &&
    window.__originalDrifts.every(animation => animation.playState === 'running'))).toBe(true)
})
