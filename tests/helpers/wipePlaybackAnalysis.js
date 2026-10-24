/** Analyze captured viewport frames after playback without changing its timing.
 * Keep this function self-contained so Playwright can serialize it into a page.
 */
export async function analyzeWipePlayback({ captured, ticks, timeOrigin, viewport, exclusions = [] }) {
  if (!Array.isArray(captured) || !Array.isArray(ticks) || !Number.isFinite(timeOrigin) ||
    !Number.isFinite(viewport?.width) || !Number.isFinite(viewport?.height) ||
    viewport.width <= 0 || viewport.height <= 0) {
    throw new TypeError('Playback analysis requires frames, ticks, timeOrigin and viewport dimensions')
  }

  const timeline = ticks.map(tick => {
    if (!Number.isFinite(tick.timestamp) || !Number.isFinite(tick.progress) || !Number.isFinite(tick.cell) || tick.cell <= 0 ||
      !Number.isFinite(tick.phase?.x) || !Number.isFinite(tick.phase?.y) || !Number.isFinite(tick.extent) || typeof tick.targetDark !== 'boolean' ||
      !Number.isFinite(tick.origin?.x) || !Number.isFinite(tick.origin?.y)) {
      throw new TypeError('Each wipe tick requires timestamp, pixel progress, cell geometry, targetDark and origin')
    }
    return { ...tick, epoch: timeOrigin + tick.timestamp }
  }).sort((a, b) => a.epoch - b.epoch)
  const latestTickAt = epoch => {
    let low = 0, high = timeline.length
    while (low < high) {
      const middle = (low + high) >>> 1
      if (timeline[middle].epoch <= epoch) low = middle + 1
      else high = middle
    }
    return low - 1
  }

  const fieldAt = (frame,x,y) => {
    let grid=frame,px=x,py=y,ground=false
    if(frame.floor) {
      const m=frame.floor.inverse,w=m[6]*x+m[7]*y+m[8]
      const u=(m[0]*x+m[1]*y+m[2])/w,v=(m[3]*x+m[4]*y+m[5])/w
      if(u>=0&&v>=0&&u<=frame.floor.width&&v<=frame.floor.height) {grid=frame.floor;px=u;py=v;ground=true}
    }
    const column=Math.floor((px-grid.phase.x)/grid.cell),row=Math.floor((py-grid.phase.y)/grid.cellHeight)
    const u=grid.phase.x+column*grid.cell,v=grid.phase.y+row*grid.cellHeight
    const project=p=>{
      if(!ground) return p
      const m=grid.matrix,w=m[6]*p.x+m[7]*p.y+m[8]
      return{x:(m[0]*p.x+m[1]*p.y+m[2])/w,y:(m[3]*p.x+m[4]*p.y+m[5])/w}
    }
    const points=[{x:u,y:v},{x:u+grid.cell,y:v},{x:u+grid.cell,y:v+grid.cellHeight},{x:u,y:v+grid.cellHeight}].map(project)
    const edge=Math.min(...points.map((a,i)=>{const b=points[(i+1)%4];return Math.abs((b.x-a.x)*(y-a.y)-(b.y-a.y)*(x-a.x))/Math.hypot(b.x-a.x,b.y-a.y)}))
    const wrap=(n,size)=>((n%size)+size)%size
    const random=(c,r)=>{
      let n=wrap(wrap(c,128)*127+wrap(r,128)*311+(frame.seed||0)*17,4093)
      n=wrap(n*(n%19+3)+97,4093);n=wrap(n*(n%23+5)+193,4093)
      return(n+.5)/4093
    }
    const c=column+(ground?37:0),r=row+(ground?71:0)
    const start=.12+.56*random(c,r),drop=start+.035+.02*random(c+19,r-7)
    const settle=drop+.045+.03*random(c-13,r+29)
    return { edge,events:frame.reverse?[1-settle,1-drop,1-start]:[start,drop,settle] }
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const blue = [0, 36, 81], light = [242, 242, 242]
  const colorTolerance = 18, edgeMargin = 4, presentationLatency = 40
  const results = []
  let previousCaptureExtent = null

  for (const [frame, { data, metadata }] of captured.entries()) {
    const epoch = metadata?.timestamp * 1000
    if (!Number.isFinite(epoch)) throw new TypeError('Each captured frame requires a CDP metadata timestamp')
    const image = new Image()
    image.src = 'data:image/jpeg;base64,' + data
    await image.decode()
    canvas.width = image.width
    canvas.height = image.height
    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    // Headed Chromium may expose only the compositor surface that fits the
    // physical window, even when innerWidth describes a wider emulated page.
    // CDP dimensions describe that captured surface in DIP; DPR is already
    // removed. Stretching a cropped JPEG to innerWidth invents cell alignment errors.
    const hasCaptureDimensions = Number.isFinite(metadata.deviceWidth) && metadata.deviceWidth > 0 &&
      Number.isFinite(metadata.deviceHeight) && metadata.deviceHeight > 0
    const pageScaleFactor = Number.isFinite(metadata.pageScaleFactor) && metadata.pageScaleFactor > 0
      ? metadata.pageScaleFactor : 1
    const cssWidth = hasCaptureDimensions ? metadata.deviceWidth / pageScaleFactor : viewport.width
    const cssHeight = hasCaptureDimensions ? metadata.deviceHeight / pageScaleFactor : viewport.height
    const scaleX = cssWidth / image.width, scaleY = cssHeight / image.height
    const scrollOffsetX = Number.isFinite(metadata.scrollOffsetX) ? metadata.scrollOffsetX : 0
    const scrollOffsetY = Number.isFinite(metadata.scrollOffsetY) ? metadata.scrollOffsetY : 0
    // Top controls are outside the JPEG. DevTools places the JPEG at offsetTop
    // before converting screen coordinates back to content coordinates, so
    // viewport-local samples do not subtract it or add document scroll offsets.
    const capture = {
      width: image.width, height: image.height, ...metadata,
      cssWidth, cssHeight, scaleX, scaleY,
      documentLeft: scrollOffsetX, documentTop: scrollOffsetY,
      mapping: hasCaptureDimensions ? 'cdp-surface' : 'viewport-fallback',
      consistent: !hasCaptureDimensions ||
        Math.abs(image.height - image.width * metadata.deviceHeight / metadata.deviceWidth) <= 2,
    }
    const captureExtent = [image.width, image.height, cssWidth, cssHeight,
      pageScaleFactor, metadata.offsetTop ?? 0, scrollOffsetX, scrollOffsetY].join(':')
    const captureExtentChanged = previousCaptureExtent !== null && previousCaptureExtent !== captureExtent
    previousCaptureExtent = captureExtent

    const currentIndex = latestTickAt(epoch), current = timeline[currentIndex]
    let minProgress = null, maxProgress = null
    if (current) {
      const priorIndex = Math.max(0, latestTickAt(epoch - presentationLatency))
      minProgress = Infinity
      maxProgress = -Infinity
      for (let index = priorIndex; index <= currentIndex; index++) {
        minProgress = Math.min(minProgress, timeline[index].progress)
        maxProgress = Math.max(maxProgress, timeline[index].progress)
      }
    }

    const bands = Array.from({ length: Math.ceil(image.height / 16) }, (_, index) => ({
      top: index * 16 * scaleY,
      bottom: Math.min(image.height, (index + 1) * 16) * scaleY,
      inspected: 0, mismatches: 0, fraction: 0,
    }))
    let valid = 0, dark = 0, inspected = 0, mismatches = 0, ambiguous = 0
    let timingInspected = 0, timingMismatches = 0
    const samples = []
    for (let y = 0; y < image.height; y += 4) for (let x = 0; x < image.width; x += 4) {
      const cssX = (x + .5) * scaleX, cssY = (y + .5) * scaleY
      if (cssX >= viewport.width || cssY >= viewport.height) continue
      // White logo/foreground ink is deliberately part of the new blue theme.
      // It must not be classified as an old light-background cell.
      if (exclusions.some(rect => cssX >= rect.x-6 && cssX <= rect.x+rect.width+6 && cssY >= rect.y-6 && cssY <= rect.y+rect.height+6)) continue
      const offset = (y * image.width + x) * 4
      let blueError = 0, lightError = 0
      for (let channel = 0; channel < 3; channel++) {
        blueError = Math.max(blueError, Math.abs(pixels[offset + channel] - blue[channel]))
        lightError = Math.max(lightError, Math.abs(pixels[offset + channel] - light[channel]))
      }
      // Foreground lettering, cube bodies and glows that match neither flat
      // palette cannot establish which background palette was presented.
      if (Math.min(blueError, lightError) > colorTolerance) continue
      const isDark = blueError < lightError
      valid++
      if (isDark) dark++
      if (!current || !capture.consistent) continue
      const {edge,events}=fieldAt(current,cssX,cssY)
      if(edge<edgeMargin) continue
      samples.push({events,isDark,isNew:isDark===current.targetDark,band:Math.floor(y/16)})
      if(events.some(t=>t>=minProgress-.01&&t<=maxProgress+.01)) continue
      const expectedDark=(events.filter(t=>t<minProgress).length%2===1)===current.targetDark
      timingInspected++
      if (isDark !== expectedDark) timingMismatches++
    }

    // Fit a presented cell pattern independently of rAF/CDP delivery latency.
    // A lost band or reversed cell still disagrees with the shared cell order.
    const buckets=512, fittedMargin=.004
    let fittedProgress=0
    if (samples.length) {
      const histogram=new Float64Array(buckets)
      let errors=0
      for(const sample of samples) {
        if(sample.isNew) errors++
        sample.events.forEach((threshold,index)=>{
          const on=index%2===0,delta=sample.isNew===on?-1:1
          histogram[Math.min(buckets-1,Math.floor(threshold*buckets))]+=delta
        })
      }
      let bestErrors=errors
      for(let bucket=0;bucket<buckets;bucket++){
        errors+=histogram[bucket]
        if(errors<bestErrors){bestErrors=errors;fittedProgress=(bucket+1)/buckets}
      }
    }
    for(const sample of samples){
      if(sample.events.some(t=>Math.abs(t-fittedProgress)<=fittedMargin)){ambiguous++;continue}
      const expectedDark=(sample.events.filter(t=>t<fittedProgress).length%2===1)===current.targetDark
      const band=bands[sample.band]
      inspected++;band.inspected++
      if(sample.isDark!==expectedDark){mismatches++;band.mismatches++}
    }

    for (const band of bands) band.fraction = band.inspected ? band.mismatches / band.inspected : 0
    results.push({
      frame, timestamp: metadata.timestamp, epoch, width: image.width, height: image.height,
      capture, captureExtent, captureExtentChanged,
      valid, dark: valid ? dark / valid : null,
      inspected, mismatches, fraction: inspected ? mismatches / inspected : 0, ambiguous, bands,
      fittedProgress, fittedMargin,
      timingInspected, timingMismatches,
      timingFraction: timingInspected ? timingMismatches / timingInspected : 0,
      progress: current?.progress ?? null, minProgress, maxProgress,
      origin: current ? { x: current.origin.x, y: current.origin.y } : null,
      tickTimestamp: current?.timestamp ?? null, tickEpoch: current?.epoch ?? null,
      tickDelay: current ? epoch - current.epoch : null,
      skipped: !capture.consistent ? 'capture dimensions changed before JPEG presentation' :
        current ? null : 'no preceding pixel tick',
    })
  }
  return results
}
