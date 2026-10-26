# Pixel theme transition

Implemented on `page-redesign-implementation`, 2026-10-24.

The current theme transition is a per-grid glitch. Whole background and perspective-ground cells switch briefly to the destination palette, drop back once, and then settle. Each cell has a deterministic randomized schedule, with a fresh seed when entering Demain Soir Bleu. Returning to Clair Obscur retraces that seed in reverse.

The wallpaper uses the enlarged square grid: `clamp(96px, 20% of viewport height, 320px)`. `gridWipeGeometry.js` reads its actual size, phase and parallax, plus the ground plane's perspective matrix and animated phase. Existing grid opacity remains unchanged by this animation update.

`pixelWipe.js` drives live palette masks and the cube shader from one native 1.2-second animation clock. Each cell has exactly three palette events, spread across the transition; nothing flashes continuously. JavaScript and WebGL use the same integer hash and timing equations. The foreground curtain has been removed, so the actual old/new theme cells remain visible throughout.

The cube keeps its geometry, materials and label atlases. Existing camera, breathing and grid clocks continue running. Reduced motion bypasses the animation; resize or a hidden tab finishes it and releases temporary masks through the existing cleanup path.

## Per-grid glitch validation — 2026-10-24

See `tests/unit/grid-glitch.test.js` for bounded event/settlement, deterministic randomness, reverse playback across projected ground, and mask partition checks against an independent oracle. Browser fixtures now inspect the visible transition directly without hiding a foreground layer. Production build, targeted ESLint, and all three unit checks passed. The in-app browser verified both Theme-face directions at 1549×1710 CSS pixels: visible old/new grid cells across the wallpaper, perspective floor and cube, no foreground curtain, no leftover palette copies or transition class after completion, and no browser errors. Captured frames are in `/tmp/dinoweb-grid-glitch/`. The complete browser regression suite and Lighthouse have not been rerun for this change.

## First-half release verification — 2026-10-24

The first release includes the complete enlarged-grid and per-grid glitch implementation. Page-control cleanup and experimental Spline files remain outside this commit. Validation used an isolated copy of the staged tree, without the uncommitted Spline runtime or page changes: production build, targeted ESLint and all three unit checks passed. Focused browser checks cover mask partitioning/reversal, six cube worker/fallback profiles, moving wallpaper edges, desktop/high-DPR/phone grid and ground alignment, branding palettes, and cleanup after interruption. Screenshot fixtures now seek between all three glitch events, pause late-starting grid clocks, and sample solid logo ink separately from grid lines. The complete browser suite and Lighthouse were not rerun.

The following entries describe earlier iterations, including the replaced curtain.

## Reference-inspired curtain validation — 2026-10-24

Production build, targeted ESLint and three timing/property tests passed. The timing test samples wallpaper and projected ground at phone, tablet, desktop and 4K dimensions in both directions and proves that a palette change is always concealed by its curtain cell. Other checks cover the opaque middle beat, cleared endpoints, connected columns and reversal.

The in-app browser verified the actual desktop Theme-face flow in both directions, including cover/hold/reveal phases and completed cleanup. Phone-width theme switching and removal of the curtain were confirmed through the DOM; narrow-view screenshot capture was unavailable. Desktop/reference screenshots are in `/tmp/dinoweb-reference/`. This pass did not rerun the complete Playwright suite or Lighthouse. Palette fixtures explicitly hide the foreground curtain to inspect the live source layers underneath it.

The following entries describe earlier iterations.

## Grid-cell refinement — 2026-10-24

Production build, targeted ESLint and 18 focused browser checks passed: three mask/randomness/reversal checks; six cube worker/fallback profiles; two moving-wallpaper edge profiles; three cleanup/interruption checks; desktop and phone grid/ground/branding alignment checks; and two unpaused high-DPR desktop/throttled-phone recordings. Playback fits the complete cell schedule, including intentional local blinks, while rejecting unexpected band dropouts and timeline resets.

Outputs are in `/tmp/dinoweb-grid-cells-mask`, `/tmp/dinoweb-grid-cells-spatial`, `/tmp/dinoweb-grid-cells-alignment`, `/tmp/dinoweb-grid-cells-phone`, and `/tmp/dinoweb-grid-cells-recording`. Earlier fixture attempts in these directories include failures before moving-phase and antialiasing handling was corrected. This is functional browser validation, not a new Lighthouse measurement.

The following entries describe earlier iterations.

## Validation — 2026-10-24

Production build and targeted ESLint passed. Across the focused browser runs, 41 checks passed: six cube palette profiles; two moving-grid edge profiles; one bounded-mask fixture; eleven repeated/cold-label theme cases; three surface lifecycle cases; eight spatial grid/clock cases; four unpaused screenshot profiles; and six recorded-playback/interruption cases. This includes worker and main-thread fallback renderers, phone/tablet input, reduced motion, delayed labels, high DPR, six-times CPU throttling, resizing, hidden tabs, and a temporarily detached cube canvas.

The recording analysis excludes foreground branding from flat-background classification: white text is valid in the blue theme. It retains every live stream frame for cell-pattern and reversal checks and uses a separate screenshot as the committed-palette presentation fence, since software/high-DPR CDP screencasts can lag the compositor. Static spatial tests independently compare the rendered wallpaper, floor, branding and cube colors against the cell field.

Latest output folders are `/tmp/dinoweb-pixel-spatial`, `/tmp/dinoweb-pixel-grids`, `/tmp/dinoweb-pixel-playback` and `/tmp/dinoweb-pixel-recording-final`. Earlier attempts in these folders include the fixture failures corrected during this work. These checks are not a new Lighthouse score or a hardware-GPU certification.

## Reverse direction refinement — 2026-10-24

Returning from Demain Soir Bleu to Clair Obscur now uses the complementary cell threshold in both JavaScript masks and the WebGL material. A regression fixture verifies that matching progress values in opposite directions produce complementary masks. Cube render gating uses conservative bounds for both directions.

Production build, targeted ESLint and ten focused mask/cube/screen-edge checks passed, including the throttled phone fallback rerun. Three unpaused playback profiles also passed: recorded high-DPR desktop, ordinary high-DPR desktop, and throttled low-end phone. Playback background classification excludes the projected cube and foreground interface; dedicated cube spatial tests continue to check its palettes. Output: `/tmp/dinoweb-reverse-pixel-check`, `/tmp/dinoweb-reverse-pixel-playback`, `/tmp/dinoweb-reverse-pixel-recording`, `/tmp/dinoweb-reverse-pixel-recording-final`. Earlier failed attempts remain in those directories for diagnosis.

## Wall/ground separation — 2026-10-25

The wall fade now belongs to the viewport-sized `.home-grid-palette`, outside the translated `.home-grid-parallax`. Masking each oversized grid child previously extended the drift layer's fade into the perspective floor. Both wall layers now fade from 50% to 72% of the viewport, leaving the lower ground clear of flat grid lines without exposing gaps at the screen edges. The loader shares these fade stops.

Backdrop and overlay grids use a shared 1.25px stroke. Grid alpha rises by four percentage points in both themes: Clair Obscur wall/drift/overlay use .20/.24/.24; Demain Soir Bleu uses .14/.20/.18. The transient canvas reads the same stroke and viewport mask geometry, keeping the per-grid theme transition consistent with the resting CSS grid.

Production build, changed-file ESLint, all three grid-glitch unit tests, and 14 focused Chromium checks passed. The six new handoff cases cover desktop, phone and tablet in both themes; eight existing grid/transition cases cover worker/fallback rendering, high DPR, CPU throttling, both transition directions and cleanup. Screenshots and results: `/tmp/dinoweb-grid-handoff-checks/`. Lighthouse was not rerun.
