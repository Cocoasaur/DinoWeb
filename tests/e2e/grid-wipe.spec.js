import { installPixelProbe, seekPixels } from './helpers/pixel-probe.js'
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
  test('reveals background and ground line pixels with the actual pixel mask in both directions', async ({ page }, testInfo) => {
    test.setTimeout(90000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await installPixelProbe(page)
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
      // Phone startup can attach the deferred drift stylesheet after the
      // initial freeze. Let CSS/parallax settle, then pause those late clocks
      // too so old/new/mixed screenshots compare the same grid phase.
      await page.waitForTimeout(4000)
      await page.evaluate(() => {
        for (const a of document.getAnimations()) if (a.animationName === 'drift' || a.effect?.getTiming().iterations === Infinity) a.pause()
      })
      const alignment = await page.evaluate(() => {
        const frame=window.__pixelFrame, floor=document.querySelector('.home-stage-backdrop:not([data-wipe-palette]) > .home-stage-backdrop__floor')
        const projected=[]
        for(const [u,v] of [[.2,.1],[.5,.5],[.8,.9]]) {
          const x=u*floor.clientWidth,y=v*floor.clientHeight,m=frame.floor.matrix,w=m[6]*x+m[7]*y+m[8]
          const point=document.createElement('i')
          point.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:0;height:0;pointer-events:none`
          floor.append(point)
          const rect=point.getBoundingClientRect()
          projected.push(Math.hypot(rect.x-(m[0]*x+m[1]*y+m[2])/w,rect.y-(m[3]*x+m[4]*y+m[5])/w))
          point.remove()
        }
        const grid=document.querySelector('.home-grid-parallax .void-grid'),style=getComputedStyle(grid)
        const size=style.backgroundSize.split(',')[0].trim().split(/\s+/).map(parseFloat)
        return { projected, cell:frame.cell,cellHeight:frame.cellHeight,size }
      })
      expect(Math.max(...alignment.projected),'ground masks match the actual CSS perspective plane').toBeLessThan(1)
      expect([alignment.cell,alignment.cellHeight],'use whole wallpaper cells').toEqual(alignment.size)
      await capture(page, 'old')
      await seekPixels(page, '__gridAnimation', 1)
      await page.waitForTimeout(200)
      await capture(page, 'next')
      const selection = await page.evaluate(theme => {
        const width = innerWidth, height = innerHeight
        const oldBase = theme === 'demain-soir-bleu' ? [242,242,242] : [0,36,81]
        const newBase = theme === 'demain-soir-bleu' ? [0,36,81] : [242,242,242]
        const pixel = (data,x,y) => Array.from(data.slice((y*width+x)*4,(y*width+x)*4+3))
        const mark = document.querySelector(innerWidth > innerHeight ? '.sidebar-home__logo' : '.mobile-branding__lockup').getBoundingClientRect()
        const candidates = []
        for (const [kind,minY,maxY] of [['background',70,height*.42], ['ground',height*.75,height-82], ['branding',Math.max(0,mark.top),Math.min(height-3,mark.bottom)]]) {
          const samples = []
          for (let y = Math.ceil(minY); y < maxY; y++) for (let x = 20; x < width-20; x++) {
            // Logo hatching/antialiasing can resemble thin grid ink on phones.
            // Its palette is checked separately in the branding case below.
            if (kind !== 'branding' && x >= mark.left-2 && x <= mark.right+2 && y >= mark.top-2 && y <= mark.bottom+2) continue
            const old = pixel(window.__gridPixels.old,x,y), next = pixel(window.__gridPixels.next,x,y)
            const distance = (a,b) => Math.max(...a.map((v,i)=>Math.abs(v-b[i])))
            const a=distance(old,oldBase), b=distance(next,newBase)
            if (kind === 'branding') {
              if (x < mark.left || x > mark.right || a < 60 || b < 60 || distance(old,next) < 65) continue
              // Clip layers can rasterize SVG stroke fringes differently.
              // Compare flat ink interiors, keeping the strict palette bound.
              if ([-1,0,1].some(dx=>[-1,0,1].some(dy=>
                distance(old,pixel(window.__gridPixels.old,x+dx,y+dy))>1 ||
                distance(next,pixel(window.__gridPixels.next,x+dx,y+dy))>1))) continue
            } else {
              // Select thin grid lines; exclude lettering and broad glows.
              if (a<4 || a>55 || b<3 || b>55) continue
              if (distance(old,pixel(window.__gridPixels.old,x+2,y))<2 && distance(old,pixel(window.__gridPixels.old,x,y+2))<2) continue
            }
            samples.push({ x,y,old,next,kind,events:window.__pixelEvents(window.__pixelFrame,x,y) })
          }
          candidates.push(samples)
        }
        return { counts:candidates.map(a=>a.length), cases:candidates.map(a=>{
          if (!a.length) return {samples:[]}
          // Seek a stable interval between all three cell events. The final
          // threshold's median may sit inside a blink where both sides agree.
          const events=[...new Set(a.flatMap(p=>p.events))].sort((a,b)=>a-b)
          const intervals=events.slice(1).map((end,i)=>({progress:(events[i]+end)/2,gap:end-events[i]})).sort((a,b)=>b.gap-a.gap)
          for(const {progress} of intervals) {
            const frame={...window.__pixelFrame,progress}
            const sides=[false,true].map(inside=>a.filter(p=>p.events.every(time=>Math.abs(time-progress)>.005) &&
              // Exact colors only where neighboring cells agree; the edge
              // fixtures independently check every antialiased grid boundary.
              [-1.5,0,1.5].every(dx=>[-1.5,0,1.5].every(dy=>window.__pixelState(frame,p.x+dx,p.y+dy)===inside))))
            if(sides.every(side=>side.length>=10)) return {kind:a[0].kind,progress,
              samples:sides.flatMap(side=>Array.from({length:10},(_,i)=>side[Math.floor(i*side.length/10)]))}
          }
          return {kind:a[0].kind,samples:[]}

        }) }
      },theme)
      expect(selection.counts.every(n=>n>20), 'visible background, ground lines and branding').toBe(true)
      // A phone's floor and wallpaper can sit at disjoint distances from the
      // face-click origin. Test each surface when its cells switch.
      for (const surface of selection.cases) {
        expect(surface.samples).toHaveLength(20)
        await seekPixels(page, '__gridAnimation', surface.progress)
        await page.waitForTimeout(200)
        await capture(page, 'mixed')
        const result = await page.evaluate(selection => {
          return selection.samples.map(p=>{
            const start=(p.y*innerWidth+p.x)*4, mixed=Array.from(window.__gridPixels.mixed.slice(start,start+3))
            const expected=window.__pixelState({...window.__pixelFrame,progress:selection.progress},p.x,p.y)?p.next:p.old
            return { ...p,mixed,expected,error:Math.max(...mixed.map((v,i)=>Math.abs(v-expected[i]))) }
          })
        },surface)
        await testInfo.attach(`${theme} ${surface.kind} grid pixels`, {body:JSON.stringify(result),contentType:'application/json'})
        await isolateGrids.evaluate(el => { el.media = 'not all' })
        await page.screenshot({path:testInfo.outputPath(`${theme}-${surface.kind}-wipe.png`),scale:'css'})
        await isolateGrids.evaluate(el => { el.media = 'all' })
        expect(Math.max(...result.map(p=>p.error)), 'each grid pixel uses the palette on its actual cell of the mask').toBeLessThan(5)
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
      const mask = e.detail.animation; window.__gridAnimation = mask
      mask.pause(); mask.currentTime = 500
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
