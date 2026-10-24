// Independent oracle: classify CSS wallpaper/ground cells, then their events.
export function expectedPixelCell(frame, x, y) {
  let grid = frame, px = x, py = y, ground = false
  if (frame.floor) {
    const m = frame.floor.inverse, w = m[6]*x+m[7]*y+m[8]
    const u = (m[0]*x+m[1]*y+m[2])/w, v = (m[3]*x+m[4]*y+m[5])/w
    if (u>=0 && v>=0 && u<=frame.floor.width && v<=frame.floor.height) {
      grid=frame.floor; px=u; py=v; ground=true
    }
  }
  return { column: Math.floor((px-grid.phase.x)/grid.cell), row: Math.floor((py-grid.phase.y)/grid.cellHeight), ground }
}

export function expectedPixelEvents(frame, x, y) {
  const cell=expectedPixelCell(frame,x,y)
  const wrap=(n,size)=>((n%size)+size)%size
  const random=(c,r)=>{
    let n=wrap(wrap(c,128)*127+wrap(r,128)*311+(frame.seed||0)*17,4093)
    n=wrap(n*(n%19+3)+97,4093);n=wrap(n*(n%23+5)+193,4093)
    return (n+.5)/4093
  }
  const c=cell.column+(cell.ground?37:0),r=cell.row+(cell.ground?71:0)
  const start=.12+.56*random(c,r),drop=start+.035+.02*random(c+19,r-7)
  const settle=drop+.045+.03*random(c-13,r+29)
  return frame.reverse?[1-settle,1-drop,1-start]:[start,drop,settle]
}

export function expectedPixelThreshold(frame, x, y) {
  const events=expectedPixelEvents(frame,x,y)
  return frame.reverse?events[0]:events.at(-1)
}

export function expectedPixelState(frame, x, y) {
  if (frame.progress<=0) return false
  if (frame.progress>=1) return true
  return expectedPixelEvents(frame,x,y).filter(t=>frame.progress>=t).length%2===1
}

export function expectedPixelEdge(frame, x, y) {
  const cell=expectedPixelCell(frame,x,y), grid=cell.ground?frame.floor:frame
  const u=grid.phase.x+cell.column*grid.cell, v=grid.phase.y+cell.row*grid.cellHeight
  const project=p=>{
    if(!cell.ground) return p
    const m=grid.matrix, w=m[6]*p.x+m[7]*p.y+m[8]
    return { x:(m[0]*p.x+m[1]*p.y+m[2])/w, y:(m[3]*p.x+m[4]*p.y+m[5])/w }
  }
  const points=[{x:u,y:v},{x:u+grid.cell,y:v},{x:u+grid.cell,y:v+grid.cellHeight},{x:u,y:v+grid.cellHeight}].map(project)
  const distance=(a,b)=>Math.abs((b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x))/Math.hypot(b.x-a.x,b.y-a.y)
  return Math.min(...points.map((a,i)=>distance(a,points[(i+1)%4])))
}

export async function installPixelProbe(page) {
  await page.addInitScript({ content: `const expectedPixelCell=(${expectedPixelCell.toString()});
    const expectedPixelEvents=(${expectedPixelEvents.toString()});
    window.__pixelThreshold=(${expectedPixelThreshold.toString()});
    window.__pixelEvents=expectedPixelEvents;
    window.__pixelState=(${expectedPixelState.toString()});
    window.__pixelEdge=(${expectedPixelEdge.toString()});
    window.addEventListener('cube-wipe-frame',e=>{window.__pixelFrame=e.detail;});` })
}

export async function seekPixels(page, animationKey, progress) {
  return page.evaluate(async ({ animationKey, progress }) => {
    const animation=window[animationKey]
    animation.currentTime=animation.effect.getTiming().duration*progress
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))
    return { ...window.__pixelFrame, progress: animation.effect.getComputedTiming().progress }
  }, { animationKey, progress })
}
