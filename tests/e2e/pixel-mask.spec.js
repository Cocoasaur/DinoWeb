import { expect, test } from '@playwright/test'
import { createPixelWipe, pixelWipeRectangles, pixelRectanglesPath, pixelUsesNewPalette } from '../../src/utils/pixelWipe.js'
import * as THREE from 'three'
import { expectedPixelEvents, expectedPixelState } from './helpers/pixel-probe.js'

function withFloor(mask) {
  const matrix=[1,.1,-mask.width*.25,0,.5,mask.height*.85,0,.001,1]
  const elements=new THREE.Matrix3().set(...matrix).invert().elements
  return { ...mask, floor: { matrix, inverse:[0,3,6,1,4,7,2,5,8].map(i=>elements[i]),
    width:mask.width*2.5,height:mask.height*1.5,cell:mask.height*.241421356,cellHeight:mask.height*.241421356,
    phase:{x:-17.23,y:-mask.height*.241421356} } }
}

test('grid-cell masks partition wallpaper and projected ground without holes or leaks', async ({ page }) => {
  const cases=[]
  for(const [width,height] of [[320,700],[430,800],[1440,900],[5072,2620]]) {
    for(const ground of [false,true]) for(const reverse of [false,true]) {
      let mask=createPixelWipe(width,height,{x:width*.6,y:height*.6},reverse,831)
      if(ground) mask=withFloor(mask)
      // Match the enlarged viewport-scaled wallpaper grid.
      expect(mask.cell).toBe(Math.min(320,Math.max(96,height*.2)))
      expect(mask.cellHeight).toBe(mask.cell)
      for(const progress of [0,.2,.4,.6,.8,1]) {
        const frame={...mask,progress}
        const tiles=pixelWipeRectangles(frame)
        expect(tiles.length).toBeLessThan(12000)
        cases.push({frame,path:pixelRectanglesPath(tiles),points:Array.from({length:160},(_,i)=>{
          const x=((i*17+.37)%60)/60*width,y=((i*31+.61)%40)/40*height
          return {x,y,expected:expectedPixelState(frame,x,y)}
        })})
      }
    }
  }
  const result = await page.evaluate(cases => {
    const context = document.createElement('canvas').getContext('2d')
    let mismatches = 0, leaks = 0
    for (const { frame, path, points } of cases) {
      const shape = new Path2D(path), inverse = new Path2D(`M0 0H${frame.width}V${frame.height}H0Z ${path}`)
      for (const { x, y, expected } of points) {
        if (context.isPointInPath(shape, x, y) !== expected || context.isPointInPath(inverse, x, y, 'evenodd') === expected) mismatches++
      }
      for (const [x, y] of [[-1, 10], [frame.width + 1, 10], [10, -1], [10, frame.height + 1]]) {
        if (context.isPointInPath(shape, x, y) || context.isPointInPath(inverse, x, y, 'evenodd')) leaks++
      }
    }
    return { mismatches, leaks }
  }, cases)
  expect(result).toEqual({ mismatches: 0, leaks: 0 })
})

// Returning to light must undo the blue pattern at complementary times.
test('the return to Clair Obscur reverses the grid-cell sequence', async ({ page }) => {
  const samples = []
  for (const [width, height] of [[430, 800], [1440, 900]]) {
    const origin = { x: width * .6, y: height * .6 }
    const forward = withFloor(createPixelWipe(width, height, origin, false, 831))
    const reverse = { ...forward, reverse: true }
    for (const progress of [.15, .35, .55, .75]) {
      samples.push({ width, height,
        blue: pixelRectanglesPath(pixelWipeRectangles({ ...forward, progress })),
        light: pixelRectanglesPath(pixelWipeRectangles({ ...reverse, progress: 1-progress })) })
    }
  }
  const mismatches = await page.evaluate(samples => {
    const context = document.createElement('canvas').getContext('2d')
    let count = 0
    for (const sample of samples) {
      const blue = new Path2D(sample.blue), light = new Path2D(sample.light)
      for (let y = 3.37; y < sample.height; y += 13) for (let x = 2.61; x < sample.width; x += 11) {
        if (context.isPointInPath(blue, x, y) === context.isPointInPath(light, x, y)) count++
      }
    }
    return count
  }, samples)
  expect(mismatches).toBe(0)
})


test('grid cells glitch independently before settling and retrace on return', () => {
  const mask=createPixelWipe(1440,900,{x:900,y:500},false,831)
  const starts=[]
  for(let column=-10;column<10;column++) for(let row=0;row<17;row++) {
    const x=mask.phase.x+(column+.5)*mask.cell,y=mask.phase.y+(row+.5)*mask.cellHeight
    const events=expectedPixelEvents(mask,x,y)
    expect(events).toHaveLength(3)
    const probes=[events[0]-.001,(events[0]+events[1])/2,(events[1]+events[2])/2,events[2]+.001]
    expect(probes.map(progress=>pixelUsesNewPalette({...mask,progress},x,y))).toEqual([false,true,false,true])
    for(const progress of probes) expect(pixelUsesNewPalette({...mask,reverse:true,progress:1-progress},x,y)).toBe(!pixelUsesNewPalette({...mask,progress},x,y))
    starts.push(events[0])
  }
  expect(Math.max(...starts)-Math.min(...starts)).toBeGreaterThan(.5)
  expect(expectedPixelEvents(mask,100,400)).not.toEqual(expectedPixelEvents({...mask,seed:1741},100,400))
})
