import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createPixelWipe, pixelCellAt, pixelCellEvents, pixelCellUsesNewPalette, pixelUsesNewPalette, pixelWipeRectangles } from '../../src/utils/pixelWipe.js'
import { expectedPixelState } from '../e2e/helpers/pixel-probe.js'

function floorFor(mask) {
  const a=mask.width*.75,f=mask.height*1.05,d=.55-.001*f
  return {matrix:[1,0,-a,0,.55,f,0,.001,1],
    inverse:[d,-.001*a,.55*a,0,1,-f,0,-.001,.55].map(n=>n/d),
    width:mask.width*2.5,height:mask.height*1.5,
    cell:mask.height*.362132034,cellHeight:mask.height*.362132034,phase:{x:-13.7,y:0}}
}

function inside(tile,x,y) {
  if(!tile.points) return x>=tile.x && x<tile.x+tile.width && y>=tile.y && y<tile.y+tile.height
  let found=false
  const p=tile.points
  for(let i=0,j=p.length-1;i<p.length;j=i++) {
    if((p[i].y>y)!==(p[j].y>y) && x<(p[j].x-p[i].x)*(y-p[i].y)/(p[j].y-p[i].y)+p[i].x) found=!found
  }
  return found
}

test('each cell has one bounded glitch and settles before the transition ends',()=>{
  const frame=createPixelWipe(1440,900,{x:0,y:0},false,831)
  const starts=[]
  for(const reverse of [false,true]) for(const ground of [false,true]) for(let col=-12;col<12;col++) for(let row=-12;row<12;row++) {
    const current={...frame,reverse}
    const events=pixelCellEvents(current,col,row,ground)
    assert.ok(events[0]>0 && events[0]<events[1] && events[1]<events[2] && events[2]<1)
    if(!reverse) { assert.ok(events[0]>=.12 && events[2]<=.81);starts.push(events[0]) }
    else assert.ok(events[0]>=.19 && events[2]<=.88)
    const probes=[0,events[0]-.0001,(events[0]+events[1])/2,(events[1]+events[2])/2,events[2]+.0001,1]
    assert.deepEqual(probes.map(progress=>pixelCellUsesNewPalette({...current,progress},col,row,ground)),[false,false,true,false,true,true])
    // No frame-dependent randomness: a paused clock must preserve the pattern.
    assert.deepEqual(events,pixelCellEvents(current,col,row,ground))
  }
  assert.ok(Math.max(...starts)-Math.min(...starts)>.5)
  const rows=Array.from({length:20},(_,row)=>pixelCellEvents(frame,3,row)[0])
  assert.ok(rows.some((v,i)=>i>0&&v>rows[i-1]) && rows.some((v,i)=>i>0&&v<rows[i-1]))
})

test('returning to light retraces the same cell pattern, including projected ground',()=>{
  let checked=0,groundSamples=0
  for(const [width,height] of [[390,844],[820,1180],[1440,900],[3840,2160]]) for(const seed of [0,831,1741,4092]) {
    const mask=createPixelWipe(width,height,{x:0,y:0},false,seed)
    mask.floor=floorFor(mask)
    for(let y=11.31;y<height;y+=47.17) for(let x=13.73;x<width;x+=61.29) {
      if(pixelCellAt(mask,x,y).ground) groundSamples++
      for(const progress of [0,.123,.333,.58,.799,.999,1]) {
        const forward=pixelUsesNewPalette({...mask,progress},x,y)
        assert.equal(pixelUsesNewPalette({...mask,reverse:true,progress:1-progress},x,y),!forward)
        checked++
      }
    }
  }
  assert.ok(checked>10000 && groundSamples>100)
})

test('painted masks match the independent cell oracle without gaps or overlap',()=>{
  let checked=0
  for(const [width,height] of [[390,844],[1440,900]]) for(const ground of [false,true]) for(const reverse of [false,true]) {
    const mask=createPixelWipe(width,height,{x:0,y:0},reverse,831)
    if(ground) mask.floor=floorFor(mask)
    for(const progress of [0,.15,.32,.51,.72,.87,1]) {
      const frame={...mask,progress},tiles=pixelWipeRectangles(frame)
      for(let y=7.31;y<height;y+=29.17) for(let x=11.73;x<width;x+=37.29) {
        const hits=tiles.filter(tile=>inside(tile,x,y)).length
        assert.equal(hits,expectedPixelState(frame,x,y)?1:0,`mask mismatch at ${x},${y},${progress}`)
        checked++
      }
    }
  }
  assert.ok(checked>10000)
})
