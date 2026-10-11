/** Analyze captured viewport frames after playback without changing its timing.
 * Keep this function self-contained so Playwright can serialize it into a page.
 */
export async function analyzeWipePlayback({ captured, ticks, timeOrigin, viewport }) {
  if (!Array.isArray(captured) || !Array.isArray(ticks) || !Number.isFinite(timeOrigin) ||
    !Number.isFinite(viewport?.width) || !Number.isFinite(viewport?.height) ||
    viewport.width <= 0 || viewport.height <= 0) {
    throw new TypeError('Playback analysis requires frames, ticks, timeOrigin and viewport dimensions')
  }

  const timeline = ticks.map(tick => {
    if (!Number.isFinite(tick.timestamp) || !Number.isFinite(tick.radius) || tick.radius < 0 ||
      !Number.isFinite(tick.origin?.x) || !Number.isFinite(tick.origin?.y)) {
      throw new TypeError('Each wipe tick requires timestamp, radius and origin.x/origin.y')
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

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const blue = [0, 36, 81], light = [232, 230, 225]
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
    // removed. Stretching a cropped JPEG to innerWidth invents circle errors.
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
    let minRadius = null, maxRadius = null
    if (current) {
      // Include the tick just before the 40 ms window to bracket its start.
      // A frame may present any radius between this prior tick and the latest
      // tick whose timestamp does not exceed the captured frame's timestamp.
      const priorIndex = Math.max(0, latestTickAt(epoch - presentationLatency))
      minRadius = Infinity
      maxRadius = -Infinity
      for (let index = priorIndex; index <= currentIndex; index++) {
        minRadius = Math.min(minRadius, timeline[index].radius)
        maxRadius = Math.max(maxRadius, timeline[index].radius)
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
      const distance = Math.hypot(cssX - current.origin.x, cssY - current.origin.y)
      samples.push({ distance, isDark, band: Math.floor(y / 16) })
      let expectedDark
      if (distance < minRadius - edgeMargin) expectedDark = true
      else if (distance > maxRadius + edgeMargin) expectedDark = false
      else continue
      timingInspected++
      if (isDark !== expectedDark) timingMismatches++
    }

    // JPEG presentation may lag the rAF clock by more than a fixed allowance.
    // Fit the observed circle independently, retaining clock comparisons only
    // as diagnostics. A rectangular missing band still violates this shape.
    const bucketWidth = Math.max(scaleX, scaleY) * 4
    let fittedRadius = null
    if (samples.length) {
      const histogram = []
      let blueCount = 0
      for (const sample of samples) {
        const bucket = Math.floor(sample.distance / bucketWidth)
        histogram[bucket] ??= { blue: 0, light: 0 }
        if (sample.isDark) { histogram[bucket].blue++; blueCount++ }
        else histogram[bucket].light++
      }
      let bestErrors = blueCount, insideBlue = 0, insideLight = 0
      fittedRadius = 0
      for (let bucket = 0; bucket < histogram.length; bucket++) {
        insideBlue += histogram[bucket]?.blue ?? 0
        insideLight += histogram[bucket]?.light ?? 0
        const errors = insideLight + blueCount - insideBlue
        if (errors < bestErrors) {
          bestErrors = errors
          fittedRadius = (bucket + 1) * bucketWidth
        }
      }
    }
    const fittedEdgeMargin = Math.max(edgeMargin, bucketWidth)
    for (const sample of samples) {
      if (Math.abs(sample.distance - fittedRadius) <= fittedEdgeMargin) {
        ambiguous++
        continue
      }
      const expectedDark = sample.distance < fittedRadius
      const band = bands[sample.band]
      inspected++
      band.inspected++
      if (sample.isDark !== expectedDark) { mismatches++; band.mismatches++ }
    }
    for (const band of bands) band.fraction = band.inspected ? band.mismatches / band.inspected : 0
    results.push({
      frame, timestamp: metadata.timestamp, epoch, width: image.width, height: image.height,
      capture, captureExtent, captureExtentChanged,
      valid, dark: valid ? dark / valid : null,
      inspected, mismatches, fraction: inspected ? mismatches / inspected : 0, ambiguous, bands,
      fittedRadius, fittedEdgeMargin, bucketWidth,
      timingInspected, timingMismatches,
      timingFraction: timingInspected ? timingMismatches / timingInspected : 0,
      radius: current?.radius ?? null, minRadius, maxRadius,
      origin: current ? { x: current.origin.x, y: current.origin.y } : null,
      tickTimestamp: current?.timestamp ?? null, tickEpoch: current?.epoch ?? null,
      tickDelay: current ? epoch - current.epoch : null,
      skipped: !capture.consistent ? 'capture dimensions changed before JPEG presentation' :
        current ? null : 'no preceding circle tick',
    })
  }
  return results
}
