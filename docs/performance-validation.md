# Portfolio performance validation

Validated October 5, 2026 with Lighthouse 13.5.0 and Chrome 154 against the
user-started production preview at `http://localhost:4173/DinoWeb/`. The final
changes are integrated into `/home/jl/Documents/JL/Code_Projects/DinoWeb_3D`.
No development or preview servers were started or stopped during this work.

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 100 | 100 | 100 | 0.33 s | 0.53 s | 7.5 ms | 0.00016 |
| Mobile | 100 | 100 | 100 | 100 | 0.84 s | 1.24 s | 32 ms | 0.00092 |

These are local startup audits using software WebGL. Their paint metrics include
the initial loading UI; interactive-cube readiness is checked separately below.
The loading screen appears on every refresh and real 3D starts automatically.
There is no static cube or interaction-triggered activation. Scores can vary
with the device and hosting; they do not guarantee a frame rate during use.

The HTML/JSON reports and a video of the slow transitions are saved in
`/home/jl/.codex/visualizations/2026/10/04/01a10732-0c71-75b1-930b-235ade9c735f/`:

- `lighthouse-arrival-dissolve-desktop.report.html` and `.json`
- `lighthouse-arrival-dissolve-mobile.report.html` and `.json`
- `progressive-blur-transitions.webm`
- `cursor-baseplate-lighting.webm`

## Startup and rendering

- The actual loader markup and its critical styles are present in the initial
  HTML. A small bootstrap yields a paint, then downloads the React app and its
  scene facade together. App mounting waits for its styles. React controls the original
  HTML loader outside its root, keeping the first-painted image in place until
  the cube's first frame, then fading and removing it.
  There is no fixed loading delay or asset-count gate.
- The loader background shares the home grid styles, theme colors and exact CSS
  perspective floor. These styles and decorative markup are present before
  React starts. The floor is static and uses no extra WebGL renderer, images or
  startup work. Both desktop/mobile grids retain their existing tile sizes.
  The loading floor stays neutral while the home baseplate responds to a cursor.
- The loader uses a 160-pixel WebP at an 80-pixel display size and system fonts.
  Its 2,644-byte image is embedded to avoid a separate request. The original
  full-resolution cube texture is retained. The initial CSS is embedded in HTML;
  shared global CSS is not reloaded by the app after the initial paint.
- Fixed wordmarks use inline SVG glyph paths from the existing font, with scoped
  hatch IDs for desktop and mobile. Both themes retain their colors and shapes.
  Source SVG assets remain SVG. Other raster portfolio assets use WebP.
- Three.js renders an OffscreenCanvas in a dedicated worker where supported.
  Resource loading, shader compilation, rendering and ray picking run there.
  Unsupported browsers or worker failures use the React Three Fiber fallback.
- Face-label idle/hover textures are generated ahead of time as WebP atlases for
  both themes and two quality levels. Startup does not rasterize canvas fonts.
  Generation scripts are in `scripts/`.
- Subtle cube reflections are restored with a Phong material on high profiles
  in both renderers. Low/mobile profiles bake key, fill, rim and a small soft
  highlight into the existing geometry. This restores shadow-side detail while
  retaining the unlit fragment shader, existing draw count and cached lighting
  until rotation or theme changes. Physical materials and environment maps are
  not required.
- A soft, broad contact shadow appears beneath the cube in both themes and
  every rendering profile, including mobile, low-end and reduced motion. It is
  a CSS radial gradient with no shadow map, raster asset, blur filter or
  extra GL draw. Its center and size follow the responsive cube layout and home
  camera zoom. Clair Obscur uses a subtle dark gradient; Demain Soir Bleu uses
  a subtle white gradient. Both fade smoothly into the floor with no hard edge.
  The broad high-profile glow/baseplate remain intact; low profiles draw only
  the inexpensive contact shadow and skip floor/hover effects.
- The perspective floor spans the viewport and fades through approximately the
  bottom quarter. It is a horizontal plane at world y=-2.35, projected using
  the cube's 45° lens and z=5 camera. One-world-unit grid tiles narrow with depth;
  cursor movement changes their convergence while keeping the horizon level.
  Home camera zoom also changes floor depth. The loading screen shares the
  neutral projection styles, without adding assets or GL draws.
- The home baseplate reacts to a fine-pointer cursor with the camera's ±0.30
  horizontal / ±0.20 vertical world-unit movement and matching shadow movement.
  The worker's mouse Y sign now matches the fallback camera and ground plane.
  Pointer events coalesce into one transform update per animation frame, with
  an 850 ms settling ease and no floor pitch/roll animation.
  No React renders or extra WebGL planes are needed. It resets during dragging,
  after three seconds of inactivity, on pointer exit/cancel/window blur, and
  during navigation or hidden tabs. Touch/reduced profiles skip cursor effects.
  The worker camera also wakes once to return from parallax after cursor idle.
- Rounded geometry and cheaper materials reduce shader work. Low-end profiles
  use vertex lighting, smaller textures, lower pixel-ratio limits and fewer
  decorations. The scene stops drawing on a settled untouched homepage, behind
  opaque pages and in hidden tabs. Profile changes preserve the camera pose
  while replacing and disposing scene resources.
- Idle breathing is restored in both renderers: a five-second sinusoidal scale
  cycle of ±1.2% is composited around the projected cube center. The floor stays
  still and ray picking accounts for the transformed canvas bounds. Breathing
  pauses during navigation, in hidden tabs and for reduced-motion preferences.
  It resumes after closing without an idle WebGL render loop, including on
  mobile/low profiles.
- The background drift layer has stable bounds regardless of stylesheet order,
  fixing the desktop layout shift caused by late utility CSS.
- Service-worker registration waits until after initial page load plus an idle
  delay, then caches emitted code, worker scripts, styles, fonts, SVGs, WebPs and
  PDFs. The build precaches 123 entries, approximately 6 MB. Distinct emitted
  asset coverage is verified independently against `dist`.
- PDF.js remains separate from the initially warmed About module. PDF rendering
  starts near the scroll viewport and uses capped canvas resolution.

## Camera and blur

Camera progress follows elapsed time with quintic easing: velocity and
acceleration reach zero at both ends. Desktop zoom-in takes 1,450 ms and zoom-out
1,550 ms, with a 900 ms dissolve and maximum 24 px blur. Mobile/low/medium
profiles use 1,200/1,300 ms, a 750 ms dissolve and maximum 12 px blur.
Reduced-motion preferences skip camera movement, breathing and blur.

The sequence is clear → progressive blur → full blur → dissolve → page →
dissolve → full blur → progressive unblur → clear. The real page begins
preparing during the cube press animation and stays transparent. Opening blur
progresses across the full 1,450 ms desktop / 1,200 ms mobile/low approach.
At the final face pose, the renderer's actual camera-completion event starts
the opacity dissolve immediately. There is no post-zoom delay timer and no
early page fade during the approach. The real page is prepared ahead of arrival;
a loading skeleton is never dissolved into view. The completed 3D frame and
full blur are held through the incoming dissolve, page view and outgoing
dissolve. The renderer resumes for the camera return after the page is gone.

Closing holds the camera at its final face pose throughout
the outgoing dissolve. Only after the page is gone does the camera return and
blur progressively clear over the full return duration. Reversing a partially
completed opacity transition can shorten that early-close dissolve; the camera
still waits until opacity reaches zero. Both renderers publish their final
coordinates before completing navigation, and the display refreshes once before
pausing. Both share the same filter timing and clipped blur edges.

## Verification

- Main-project production build, focused ESLint and whitespace checks pass.
- Easing checks verify monotonic progress, symmetry, smooth endpoints,
  wall-clock timing and reduced-motion behavior.
- Loader-background checks pass on desktop/mobile in light/dark themes, on
  navigation and refresh: matching computed home grid/floor styles, clipped
  floor bounds, automatic real cube readiness and no page errors. Screenshots
  are saved as `loader-background-{desktop,mobile}-{light,dark}.png`.
- Desktop/mobile navigation and refresh show the loader, followed automatically
  by the worker-rendered interactive cube, without a static cube or page errors.
- Contact-shadow checks pass desktop/mobile in both themes, portrait resize,
  reduced motion, the worker and forced fallback, and a simulated 2-core/2 GB
  mobile with 6× CPU throttling in both renderers. They verify placement below
  the cube, centering, zoom scaling, visibility through navigation, no idle GL
  draws and no page errors. Screenshots are `contact-shadow-*.png`. Simulated
  low-end startup measured 1.16–1.28 seconds in the worker and 1.90 seconds in
  the forced fallback; page opening measured 2.61–2.70 seconds including the
  deliberately slow camera/blur/dissolve sequence.
- Cursor-baseplate/lighting checks pass in light/dark themes, the worker and
  fallback, mobile, simulated low-end 6× CPU throttling and reduced motion.
  Computed floor/shadow transforms verify response on both sides, drag reset,
  idle reset, visibility suspension/resume, cancellation and pointer exit.
  Idle worker draw counts settle. Screenshots are saved as
  `baseplate-lighting-*-{neutral,left,right}.png`.
- Progressive-motion checks pass desktop, mobile, forced fallback, reduced
  motion and a simulated 2-core/2 GB mobile with 6× CPU throttling. Continuous
  computed-style samples verify progressive opening blur, full blur before and
  throughout the dissolve, a held closing camera, progressive return unblur,
  breathing without additional idle WebGL draws, resumption after return, early
  close and visibility pause/resume. Samples are saved in `motion-*-samples.json`.
- Previous browser regression checks passed early close,
  zero covered-scene draws, tab suspension/resume, theme switching and refresh,
  rendering-profile resize, touch drag/pinch, forced fallback, reduced motion,
  deferred PDFs, both résumé/CV tabs and certificate filtering.
- All distinct emitted portfolio assets are cached. Offline refresh, real worker
  rendering, project detail navigation and visible screenshot loading pass.
- A simulated 2-core/2 GB mobile with 6× CPU throttling completed automatic cube
  startup in approximately 1.2 seconds. Cold/repeated slow page opening took
  2.24/1.90 seconds; closed/covered scenes stopped drawing. These are simulated
  checks, not physical-device measurements.
- Earlier viewport checks verified lower markers at 16 px from the mobile bottom
  and 10 px in landscape, with stable pinch zoom. Physical low-end Firefox
  validation remains useful.

- Recovery regressions pass for missing page chunks, persistent failures, missing
  bootstrap/PWA imports, blocked session storage, offline navigation, section
  rendering errors and a stale worker returning HTML for JavaScript requests.
  They verify one automatic retry, a visible manual retry without loops,
  successful navigation after recovery, preservation of the selected theme and
  no uncaught page errors. All four emitted section modules resolve; desktop
  and mobile navigation and refresh pass on the final build.
- Final simulated 2-core/2 GB mobile checks with 6× CPU throttling pass for
  the worker and forced fallback, including startup, zoom, shadow alignment
  and page navigation. Startup measured 1.22 s / 1.96 s, and page opening
  2.66 s / 2.67 s including the deliberate camera and dissolve timing.
- Final loader checks preserve the same HTML loader/image nodes across React
  mounting, with one loader at a time. Desktop/mobile in both themes and on
  refresh retain the home grid/floor and automatically reveal the real cube.
- Before preserving the original HTML loader, the recovery build scored 100 on
  desktop and 99 on mobile (2.11 s simulated LCP, 0 ms blocking time). The final
  build preserves the first-painted image instead of recreating it when React
  mounts; the earlier recovery-only runs both scored 100 with 0 ms blocking
  time. The dissolve-adjustment runs also scored 100 in both profiles, with
  0 ms desktop / 19 ms mobile blocking time. Enlarged-floor runs scored 100
  with 0 ms desktop / 39 ms mobile blocking time. The latest camera-matched
  arrival-triggered dissolve runs appear in the table above.
  Earlier reports are retained as `lighthouse-load-recovery-before-loader-*`.

- Overlapping-dissolve checks pass desktop, mobile, forced fallback, reduced
  motion and a simulated 2-core/2 GB mobile with 6× CPU throttling. The first
  visible dissolve followed approach blur by approximately 277 / 210 / 374 /
  242 ms for desktop / mobile / fallback / low profiles. Samples confirm full
  blur before the page appears, continuing camera movement during opacity fade,
  a held outgoing pose, progressive return unblur, breathing resumption and no
  late reopen after early close. Video: `overlapping-dissolve-transitions.webm`;
  computed-style samples: `overlap-*-samples.json`.
- Missing-page recovery, persistent retry and stale-worker recovery pass again
  with press-time page preparation. Desktop/mobile normal navigation, all four
  section modules and refresh pass with no uncaught page errors.

## Recovery after a rebuild

- The bootstrap listens for Vite import failures before loading React. A missing
  page, stylesheet, bootstrap or PWA module gets one automatic refresh within a
  two-minute window. It releases only the portfolio's stale worker registration
  before fetching the current shell, leaving caches and saved themes intact.
- Persistent failures, offline failures and section rendering errors show a
  usable reload screen outside the React root. Session storage, or a URL marker
  when storage is blocked, prevents automatic refresh loops.
- Service-worker updates wait for the visitor to accept the update. The reload
  button activates the waiting worker before refreshing; an open page keeps its
  current worker and cached chunks until then. Full-portfolio precaching remains.
- Recovery is only active on failures; normal startup adds no recovery requests.

## Commit preparation

The session changes are organized into 18 focused commits covering public WebP
assets, device budgets, Firefox viewport fixes, SVG wordmarks, deferred fonts,
PDF rendering, prebuilt label atlases, cube lighting, composited stage effects,
the worker renderer, progressive blur, entrance cleanup, automatic startup,
loader preservation, full precaching, stale-chunk recovery, the overlapping
dissolve and validation documentation. Every intermediate source snapshot
successfully builds in a temporary directory without starting a server.
Separate local footer, dependency/test setup, ignore-file and DOCX changes are
preserved outside this commit series.

## Development workflow

Edit and build in the main project directory. Use `npm run dev` while editing.
For production testing, run `npm run build`, then start `npm run preview` yourself
and use the URL Vite prints. An existing preview can serve a successfully rebuilt
`dist` folder; refresh after the build finishes. Audits must use the build from
that same project folder.

- Enlarged-floor checks pass desktop/mobile in both themes, simulated 2-core/2 GB
  mobile with 6× CPU throttling, the fallback renderer and reduced motion. They
  verify floor depth/full-width coverage, cursor response/idle reset, dark versus
  light shadow colors, projected alignment, home zoom scaling, navigation, idle
  draw counts and no page errors. Screenshots are `enlarged-floor-*.png`; the
  check script is saved as `enlarged-floor-check.cjs`. Loader checks were repeated
  in both themes on desktop/mobile, including refresh; initial HTML and home
  floors match. Fresh desktop/mobile Lighthouse reports have all four categories
  at 100, with no run warnings or runtime errors.

- Ground-perspective checks pass desktop in both themes, mobile, simulated
  2-core/2 GB mobile with 6× CPU throttling, the fallback renderer and reduced
  motion. The worker's projected cube origin matches the floor's camera offsets
  within two CSS pixels after settling. Matrices confirm the ground stays level,
  with no cursor-induced roll. Checks also cover horizon fade/full-width coverage,
  theme shadow colors, idle reset, wheel zoom, navigation, portrait resize, zero
  extra idle GL draws and no page errors. Loader identity/background/refresh
  checks were repeated in both themes on desktop and mobile. Screenshots and
  the saved check script are named `ground-parallax-*`; a motion recording is
  saved as `ground-perspective-motion.webm`.

- Fresh ground-parallax Lighthouse runs score 100 in performance, accessibility,
  best practices and SEO on both desktop and mobile, without run warnings or
  runtime errors. A cropped MP4 motion preview is saved as
  `ground-perspective-motion.mp4`; the full recording remains available as WebM.

- Arrival-triggered dissolve checks pass desktop/mobile, forced fallback, a
  simulated 2-core/2 GB mobile with 6× CPU throttling and reduced motion.
  Sampling actual worker completion messages shows the fade phase and opacity
  target update within the next UI update (9 ms desktop, 34 ms mobile, 13 ms
  simulated low-end in this run). A 400 ms cold Projects module delay still
  leaves the actual page ready before arrival. Samples verify no early opacity,
  full blur during fade, a held final face, progressive return unblur, early
  close, restored breathing, visibility pause/resume and no page errors.
  The software-rendered compositor can paint less frequently than UI updates;
  these event timings measure the absence of a post-arrival delay timer.
  Results and the saved check script are `arrival-dissolve-*`.

- Fresh arrival-dissolve Lighthouse runs score 100 for performance, accessibility,
  best practices and SEO on desktop and mobile, without run warnings or runtime
  errors. Their initial paint/readiness scope is the same as the earlier audits;
  the navigation timeline is measured separately by the sequence checks above.

## Theme wipe palette synchronization — October 8, 2026

Validated in the `32d0` worktree against its production preview at
`http://127.0.0.1:4175/DinoWeb/`.

- The live cube follows the actual circular boundary per pixel, in both expanding
  and shrinking directions. Body, labels, edges and corner markers select the
  old or new palette in their existing draw calls, in both renderer paths.
  The circle comes from the browser's computed clip path, including its easing
  and clock. Sampling runs only during the transition; there are no React frame
  updates, additional scene passes or new idle render loops. Settled low-end
  rendering wakes only when the boundary crosses the projected cube bounds.
- Six screenshot regressions compare four real body pixels while the browser's
  circle is paused between them. Each direction must show two old and two new
  pixels. Profiles cover desktop/phone worker and fallback rendering, low-end
  phone and 6× CPU-throttled low-end fallback.
- Theme regressions check continuous breathing/grid/floor animation identity,
  canvas identity, cold label loading, reduced motion, missing view transitions,
  and settled mobile worker draw counts. Device-budget and navigation regressions
  also exercise the existing rendering and transition behavior.
- Production build passes. Changed renderer/hooks/timing files pass ESLint;
  `ThemeContext.jsx` retains its existing `useTheme` Fast Refresh lint finding,
  confirmed against the original source.

Fresh local Lighthouse performance audits of this build:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00014 |
| Mobile | 100 | 1.1 s | 1.4 s | 0 ms | 0.00084 |

Both runs have no audit warnings. All 31 browser regressions pass (six pixel
checks plus 25 motion, navigation and device-budget checks). These audits preserve
the startup/loader measurement scope described above; interaction regressions
verify the actual wipe separately, including CPU-throttled low-end profiles.
Reports, regression results and split-palette screenshots are saved in
`/home/jl/.codex/visualizations/2026/10/08/01a11b9d-fab2-7fc3-8f18-04f178854d21/`
as `cube-spatial-desktop.report.html`, `cube-spatial-mobile.report.html`, their
JSON counterparts, `cube-spatial-regressions.json`,
`cube-spatial-pixel-checks.json`, and `cube-spatial-*.png`.

## Responsive home alignment — October 10, 2026

The recording's near-square and portrait tablet layouts are covered by viewport
checks at 661×695, 527×497 and 960×1440, alongside neighboring breakpoints.

- Branding and cube placement now share one viewport composition. Visible SVG
  bounds determine the portrait lockup's center and clearance. Landscape branding
  fits its left column, while the cube fits the remaining space using its camera
  projection. Vertical positioning uses the camera's vertical FOV independently
  of aspect ratio, consistently for touch and fine-pointer devices.
- Headers, footer and desktop controls use shared insets. Width and height fit the
  composition continuously; conflicting orientation and brand-scale overrides
  have been removed. Existing tablet/low-end control limits remain in place.
- Composition and CSS variables update only on viewport events through the
  existing coalesced size measurement. No render loop, scene pass, renderer or
  shader was added. The previous cube wipe, breathing, grid/floor motion and
  navigation implementation remain intact.
- Pixel regressions use the worker's published rendered center to account for
  desktop parallax and sample interior body pixels. They also assert neutral body
  colors before checking the old/new palette split, rejecting background samples.

All 41 distinct browser checks pass: the final six wipe checks and four alignment
profiles, plus 31 existing resize, theme motion, navigation and device-budget
checks. The alignment matrix covers 21 sizes on each of four profiles, including
6× CPU-throttled low-end fallback rendering (84 viewport cases). Build and
changed-file ESLint checks pass.

Fresh local Lighthouse performance audits against the production preview:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00017 |
| Mobile | 100 | 0.8 s | 1.0 s | 0 ms | 0.00025 |

Both runs have no audit warnings. Startup/loader measurement scope remains the
same as the earlier audits; separate interaction checks cover the actual cube.
Reports, the combined passing-check summary and corrected screenshots are saved
under the artifact directory above in `responsive-2026-10-10/` as
`desktop.report.html`, `mobile.report.html`, their JSON counterparts,
`summary.json`, `final-alignment-and-wipe.json` and `aligned-*.png`.

## Centered mobile/tablet text — October 10, 2026

DINO, WEB, JL’S DEV DEN and the version caption now each share the viewport’s
centerline in the portrait composition. The mobile SVG viewBoxes crop uneven
trailing whitespace with padding around their existing painted glyphs; the
original paths, theme colors and one-time outline animation remain intact.
Captions sit below the two words, and the shared viewport composition reserves
the full 232-unit branding height before fitting the cube. Landscape branding
and the symmetrical header/footer insets retain the previous responsive fixes.

The alignment regression now checks actual SVG glyph and text-range centers,
individual line separation, cube/cue clearance and existing header/footer
alignment. It covers 22 viewport sizes on four renderer/device profiles (88
cases), including the reported 375×667 phone and 768×1024 tablet, rapid orientation
changes, worker/fallback rendering and a 6× CPU-throttled two-core/2 GB fallback.
All four profiles pass, with a maximum painted center offset below 0.02 px.

This change adds no frame loop, observer, shader, scene pass or dependency.
Existing viewport-event measurement and fitting handle the taller text block.
Build and changed-file ESLint checks pass.

All 44 distinct browser checks pass: four alignment profiles plus 40 existing
resize, theme-motion, circular-wipe pixel, device-budget and startup-outline
regressions. Those checks include reduced motion, cold theme labels and
worker/fallback renderers. Both worktree and main-checkout production builds pass.

Fresh local Lighthouse performance audits of the final production build:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00016 |
| Mobile | 100 | 0.8 s | 1.0 s | 0 ms | 0.00072 |

Both audits have no warnings. Their startup/loader measurement scope remains
the same as the earlier audits; the browser regressions test cube interactions
separately. Reports, the 88-case alignment measurements, 40 regression results
and phone/tablet screenshots are saved under the artifact directory above in
`centered-branding-2026-10-10/` as `desktop.report.html`, `mobile.report.html`,
their JSON counterparts, `alignment.json`, `regressions.json`, `summary.json`
and `aligned-375x667.png` / `aligned-768x1024.png`.

## Staggered branding group hotfix — October 10, 2026

This supersedes the individually centered words/captions described above. The
reference arrangement is restored: DINO on the upper left, the three-line version
caption on its right, JL’S DEV DEN on the lower left and WEB on the lower right.
The complete 374×174 composition is horizontally centered as one group. The
existing cropped SVG viewBoxes keep uneven asset whitespace from shifting the
painted group; the original glyphs, theme colors and outline animation remain.

The shared viewport composition fits the entire group to the available width
and height, and reserves its height before fitting the cube. Existing portrait/
landscape behavior, header/footer alignment, circular wipe and device budgets
remain in place. This hotfix adds no frame loop, observer or rendering pass.
Regression assertions now check combined painted bounds and the reference’s
relative word/caption placement, rather than centering each word individually.

All 13 hotfix browser checks pass: four alignment profiles covering 88 viewport
cases, six circular-wipe pixel checks in both directions, and three startup/
interaction outline checks for tablet, phone fallback and reduced motion. The
alignment matrix includes the reported phone/tablet sizes and a 6× CPU-throttled
low-end fallback. The maximum painted-group center offset is below 0.01 px.
Both production builds, changed-file ESLint and diff-whitespace checks pass.

Fresh local Lighthouse performance audits of the final hotfix build:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00017 |
| Mobile | 100 | 1.1 s | 1.4 s | 0 ms | 0.00030 |

Neither audit has warnings. These retain the startup/loader measurement scope
described above; separate browser checks cover the actual cube wipe and input.
Reports, corrected phone/tablet screenshots and combined-group alignment
measurements are saved under the artifact directory above in
`grouped-branding-2026-10-10/` as `alignment-and-wipe.json`, `wordmark.json`,
`summary.json`, `desktop.report.html`, `mobile.report.html`, their JSON
counterparts, and `aligned-375x667.png` / `aligned-768x1024.png`.

## Desktop cursor bar visibility — October 10, 2026

Reproduced the reported missing-bar state at 1440×900: the high-tier desktop
profile mounted the bar inside the viewport, while the medium-tier profile
removed it from the DOM through App’s shared `reduceEffects` guard. The
decorative mouse control now depends on desktop input and motion preference,
independently of the cube’s expensive rendering effects. Desktop medium/low
quality and slow-connection profiles retain the bar without raising their scene
quality or DPR. Existing touch, reduced-motion and tablet-width hiding remains.

The bar now has explicit 8 px bounds. Its center keeps the same shared right
inset, and the existing passive mouse listener continues to track cursor Y
without React updates or an idle render loop.

All 18 browser checks pass: six cursor-control profiles, four alignment profiles
covering 88 viewport cases and eight existing device-budget/effect checks. Real
mouse input checks rendered marker Y positions and bounds at the upper/lower
viewport, including a 6× CPU-throttled low-end desktop. Width changes preserve
tablet hiding and desktop restoration; touch and reduced-motion rules remain.
Both builds, changed-file ESLint and diff-whitespace checks pass.

Fresh local Lighthouse performance audits:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00018 |
| Mobile | 100 | 1.1 s | 1.4 s | 0 ms | 0.00030 |

Both audits have no warnings and retain the startup measurement scope above.
Reports, regression results and the corrected medium-desktop screenshot are
saved under the artifact directory above in `desktop-scrubber-2026-10-10/` as
`desktop.report.html`, `mobile.report.html`, their JSON counterparts,
`regressions.json`, `summary.json` and `desktop-cursor-bar.png`.


## Background and ground palette wipe — October 10, 2026

The live background and floor previously inherited the new CSS palette as soon
as the native theme transition callback ran. Their named transition groups sit
above the root snapshots, so the root circle could not hide that immediate swap.
Both now retain their old palette ahead of the circle and reveal the new palette
behind it, in both directions. Floor pool/shadow gradients use the same palette
handoff without changing their existing colors or geometry.

The grid reveal samples the browser’s actual circle through the cube’s existing
short-lived transition loop. Temporary CSS palette copies use complementary
circle/path clips, share the original CSS drift clocks, and follow the live
floor’s camera transforms. Original nodes/animations remain in place. A static
outer view-transition group lets the background’s inner parallax continue
moving. Copies and held palette/clip styles are removed on completion or
interruption. This adds no WebGL context/pass, React frame updates or idle loop;
DPR, scene quality and reduced-motion/no-transition behavior remain unchanged.
The earlier centered staggered branding, responsive composition and desktop
cursor-bar fixes remain in both checkouts.

All 38 distinct browser checks pass: six new background/ground pixel profiles,
one live-clock/interruption check, eleven existing theme/motion checks, six cube
wipe profiles, six desktop/touch-grid motion checks and eight rendering-budget
checks. The new pixel fixtures sample 480 visible line pixels across both reveal
directions, with maximum RGB-channel error of 1 out of 255. They cover worker and
fallback renderers, phones, desktops and a 6× CPU-throttled low-end fallback.
The live-motion check retains original animation objects, finds zero clock skew
between old/new drift textures, and verifies matching projected floor matrices.

The first broader run found two desktop cube-fixture failures: its fixed 200 ms
wait captured before asynchronous WebGL paint, while the next screenshot already
showed the correct palette. The fixture now waits for observable rendered colors
while retaining its palette-difference and spatial-mask assertions. All six cube
profiles then passed; production cube rendering code was not changed.

Both production builds, changed-file ESLint and diff-whitespace checks pass.
All changed/new source files match in the main checkout and Codex worktree.

Fresh local Lighthouse performance audits of the final production build:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00021 |
| Mobile | 100 | 1.1 s | 1.4 s | 0 ms | 0.00100 |
| Mobile repeat | 100 | 0.8 s | 1.0 s | 2 ms | 0.00094 |

All three audits have no warnings. The pre-fix mobile baseline also scored 100,
so the user’s reported 99 was not reproduced locally; these measurements do not
establish its cause or guarantee identical results on other devices. Audits
retain the startup/loader measurement scope above; separate browser tests cover
the actual circular wipe, ongoing motion and settled rendering budgets.

Reports, pixel measurements, live-clock results and screenshots are saved under
the artifact directory above in `grid-wipe-2026-10-10/`: `desktop.report.html`,
`mobile.report.html`, `mobile-repeat.report.html`, their JSON counterparts,
`grid-wipe-baseline-mobile.report.html` / `.json`, `grid-pixels.json`,
`live-motion.json`, `regressions-initial.json`, `cube-pixels-final.json` and
`summary.json`. The summary combines final passing results for all 38 distinct
checks and retains the initial desktop fixture failures for traceability.


## Grid wipe compositing hotfix — October 10, 2026

The follow-up recording exposed a failure during normal playback that the
previous small-viewport, paused-circle fixtures missed: background/floor grids
vanished, the palette snapped and branding briefly disappeared. The previous
complementary path used a whole viewport width as its outside margin, and kept
large circle masks even when the circle already covered the entire layer. At
the reproduced 2536×1310 desktop size, its outer rectangle was 7608×6382 CSS
pixels. This unnecessary geometry caused expensive offscreen compositing and
missing/rectangular paint during the running wipe. Disabling palette crossfades
alone did not resolve the large-screen failure.

The complementary rectangle now has fixed 128 px grid overscan and no floor
overscan. Fully covered/empty circle states use an unclipped layer and an empty
inset, avoiding an oversized circle/path entirely. The temporary palette’s pause
attribute is written only when it changes. Original grid/floor geometry, live
drift clocks, cube shader, circular timing and all earlier local fixes remain.
There is no new rendering pass, idle loop or increase in device quality/DPR.

A new unpaused playback regression fails against the unchanged previous build
with missing grid lines, and passes against this hotfix at the recorded desktop
size. All 12 targeted checks pass, including worker/fallback renderers, large
high-DPR desktops, a CPU-throttled low-end phone, interruption cleanup and seven
spatial pixel profiles. All 560 grid pixels agree with their side of the circle
within one RGB level. Eight running wallpaper captures have no palette
mismatches and retain painted lines; branding visibility is checked separately.

Recorded-desktop and throttled-phone playback use the unchanged production
2-second animation. High-DPR desktop capture fixtures stretch only their test
circle to 8 seconds so software screenshot capture cannot consume its entire
lifetime; they keep CSS drift and the circle running. The high-DPR spatial
fixture separately checks both sides at intermediate radii. Both production
builds, changed-file ESLint and diff-whitespace checks pass, and source/build
outputs match between the main checkout and Codex worktree.

All 25 additional cube/theme and rendering-budget regressions pass, giving 37
passing checks in total. This includes continuous motion, both cube palette
reveal directions, reduced motion, unavailable view transitions and the existing
desktop/mobile device budgets.

Fresh local Lighthouse performance audits of the final hotfix build:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00018 |
| Mobile | 100 | 0.8 s | 1.0 s | 0 ms | 0.00098 |

Neither audit has warnings. These measure startup as described above; playback,
spatial palette masks and device-budget checks are verified separately. Reports
and evidence are saved under the artifact directory above in
`grid-glitch-2026-10-10/`: `desktop.report.html`, `mobile.report.html`, their JSON
counterparts, `baseline-playback.json`, `fixed-playback-and-pixels.json`,
`regressions.json`, `pixel-summary.json` and `summary.json`, plus screenshots of
the recorded glitch and the corrected grid/cube palette split. The baseline
failure is retained to show that the new running-wipe regression catches the
previous implementation’s missing-grid state.

## Complete circular-wipe playback hotfix — October 10, 2026

The follow-up recording `recording_20261010T051439.mp4` exposed a later-phase
failure that the previous early-frame and paused-radius checks missed. At 3.5 s,
the sampled wallpaper's dark coverage drops by 39.58 percentage points while
the cube continues revealing its new palette. The previous hotfix's passing
checks therefore did not establish correct playback through the whole wipe.

Two issues remained. The native root circle advanced on the compositor while
JavaScript sampled its radius and separately repainted the live grid/floor and
WebGL masks. Under rendering load, those frames diverged and stale fullscreen
content could obscure or reverse the reveal. With all other source unchanged,
restoring the previous independent clock fails the new complete-playback test:
the sampled background changes completely back to its previous palette.

`themeWipe.js` now advances the native circle's current time in the existing
transition-only animation-frame callback using explicit seeks on a paused
native circle, before reading its eased radius and
updating the live masks. It retains the same two-second duration and native
cubic-bezier easing. This controls only the reveal; original grid drift, floor
motion, cube breathing and renderer resources keep their existing clocks.
A visibility change skips and cleans up the wipe so a hidden tab cannot strand
the controlled animation. Reduced-motion and unsupported-browser paths retain
the existing immediate theme switch.

The inverse path also had an XOR error: subtracting an unbounded circle from a
bounded rectangle paints the circle outside that rectangle. Reducing only the
outer rectangle had left those offscreen arcs in the mask. `boundedCircle.js`
intersects the circle with the paint bounds using exact arcs and edges before
constructing its inverse. Background overscan remains 128 px; floor bounds
remain the viewport. Layout/matrix reads are collected before mask writes,
avoiding repeated synchronous layout within a frame. No additional WebGL pass,
idle loop, persistent duplicate backdrop or increase in DPR/device budgets was
introduced. Earlier responsive, branding, cursor scrubber and theme changes
remain intact.

43 relevant regression checks pass across focused runs. They cover spatial
cube palettes, 560 background/ground pixel samples, unchanged renderer budgets,
continuous source motion, cold labels, reduced motion, unsupported view
transitions and cleanup after interruption. The inverse geometry also agrees
with the expected reveal at 324,000 sampled points: the previous formula leaks
15,939 offscreen samples; the corrected formula has zero leaks or mismatches.

The new complete-playback checks stream all three successive production-duration
wipes at the recording's 2536×1310 desktop size, a common 1440×900 high-DPR
worker/fallback desktop, and a 6× CPU-throttled 430×800 low-end fallback phone.
All 12 wipes pass, with 660 captured frames and no background reversal beyond
sampling/antialiasing noise (maximum 0.05 percentage points). The rotated cube
face-click origin is exercised. A separate hidden-tab test confirms cleanup
and the ability to switch themes again after resuming.

A full 5072×2620 software screencast is too sparse to require an intermediate
frame reliably in every two-second wipe. That size retains separate spatial
pixel coverage. Legacy desktop single-strip fixtures use eight seconds to
allow software screenshot capture; the new stream checks retain the actual
two-second production duration. These capture accommodations do not change
application timing or device quality.

Fresh local Lighthouse performance audits of the final build:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.3 s | 0.5 s | 0 ms | 0.00018 |
| Mobile | 100 | 1.1 s | 1.4 s | 0 ms | 0.00097 |

Both audits have zero blocking time and no warnings. They measure local startup,
including the existing loading UI, as documented above. Interactive playback,
original clocks, palette geometry and device budgets are checked separately;
these scores are not a promise for every device or network.

Evidence is saved in `grid-wipe-final-2026-10-10/` under the artifact directory
above: `native-clock-before.json`, `recording-palette-trace.json`,
`inverse-mask-before-after.json`, `complete-playback.json`,
`playback-summary.json`, `strip-captures.json`, `final-motion.json`,
`final-live-clocks.json`, `check-summary.json`, and the desktop/mobile HTML and
JSON Lighthouse reports. Earlier diagnostic capture failures are retained for
traceability; `check-summary.json` selects the latest outcome for each test.
The main checkout and Codex worktree contain matching fix sources and rebuilt
production assets. All previous local changes outside this fix are preserved.

## Live-layer theme wipe hotfix — October 10, 2026

The recording `recording_20261010T080316.mp4` showed that controlling the native
snapshot animation's time had not solved the actual desktop glitch. Browser
snapshots still composited separately from the moving DOM layers and live WebGL
canvas. A new background/text palette could appear before its circle, while
stale snapshot content later obscured the reveal.

Theme switching now uses a targetless Web Animation as a timing clock and does
not capture native View Transition snapshots. One eased circle drives the
existing cube shader and temporary DOM palette copies for the background grid,
ground, branding and viewport chrome. The masks stay bounded to the viewport;
the copies retain the live layers' animation clocks and camera transforms. SVG
paint IDs are scoped to each copy so hatching follows its own palette. The
theme label retains React's original text nodes across repeated switches.

The copies, timing animation and frame callback are removed when the wipe ends
or the tab is hidden. There is still one WebGL canvas and no extra renderer pass,
idle frame loop or increase in device pixel ratio/device quality budgets. The
previous responsive branding, desktop cursor scrubber, cube motion and fallback
label preparation changes are retained.

74 relevant checks pass across the focused runs. Coverage includes both reveal
directions, 840 background/ground/branding pixel samples, original motion clocks,
renderer budgets, responsive alignment, desktop cursor tracking, SVG paint IDs,
label text-node identity, cold labels, reduced motion and interruption cleanup.
Two earlier timing/input capture failures in the unchanged desktop page-transition
and tablet wordmark tests passed on the final focused rerun; the diagnostic
reports retain those earlier failures. The final rerun passes all 15 checks.

The final complete-playback stream captures 805 frames across 12 successive
two-second wipes: the recording's 2536×1310 desktop, 1440×900 high-DPR worker
and fallback desktops, and a 6× CPU-throttled 430×800 low-end fallback phone.
There is no background reversal beyond sampling/antialiasing noise (maximum
0.071 percentage points). Native View Transition calls are disabled in these
checks, and each switch verifies one canvas and removal of the temporary layers.

Fresh local Lighthouse 13.4.1 performance audits of this build:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.33 s | 0.53 s | 0 ms | 0.00020 |
| Mobile | 100 | 0.98 s | 1.37 s | 0 ms | 0.00036 |

Both audits have no warnings. These are local startup measurements; the
interactive wipe and low-end renderer budgets are checked separately. A local
100 does not establish that every device or network will score identically.

Evidence is saved in `live-theme-wipe-2026-10-10/` under the artifact directory
above: `broad-checks.json`, `additional-checks.json`, `final-checks.json`,
`check-summary.json`, `playback-summary.json`, per-profile frame captures and
measurements, and desktop/mobile HTML and JSON Lighthouse reports. The main
checkout and Codex worktree contain the same fix sources and production build.
Previous commits and unrelated local changes are preserved.

## Background grid edge-mask hotfix — October 10, 2026

The recording `recording_20261010T084809.mp4` contains two brief light flashes
during the expanding blue wipe: 33.3 ms at 2.583333 s and 50 ms at 2.733333 s.
In the second flash, sampled blue coverage drops from 72.27% to zero, then
returns to 98.88%. The DOM text and grid disappear while the WebGL cube remains
visible. On the reverse wipe, nine vertical grid lines lose their lower segments
below recording row 631 in six frames, totaling 100 ms. This rectangular dropout
does not follow the circular boundary.

The moving grid was using two changing, complementary full-viewport `path()`
masks, with additional gradient masks and transformed tiled children. The
recording is consistent with compositor mask/tile invalidation at viewport
crossings. This is an inference from the recording and rendering structure;
the user's hardware compositor has not been reproduced in the headless checks.

The background now keeps an opaque, unclipped light grid underneath one dark
grid clipped with a native CSS `circle()`. The dark circle grows or shrinks with
the same radius used by the cube and existing transparent layers. A reverse
wipe inserts its temporary light copy below the original dark grid. There is
no changing inverse path on the wallpaper and no gap between complementary
background masks. Viewport overflow bounds the established tile overscan.
Original grid drift, parallax, floor motion, text nodes, cube resources and
device budgets are retained; temporary copies still disappear after the wipe.

The new regression rejects the previous implementation's clipped light base.
With the fix, it samples all pixels around side/corner crossings in both
directions while grid drift remains running: 72 radius samples, 23,054,152
palette checks and 1,548 horizontal bands across a high-DPR desktop and a
6× CPU-throttled fallback phone. There are zero palette mismatches and every
band retains grid lines. Dense sampling also avoids an initial test-fixture
aliasing error where a 2 px stride skipped 1 px lines.

35 focused checks pass, including cube palettes, grid/floor motion, shared
clocks, cleanup and device budgets. Twelve complete two-second wipes produce
822 captured frames with no background reversal beyond sampling noise
(maximum 0.071 percentage points). The large recorded desktop's background
capture uses a transparent canvas fixture to avoid software GL compositing
undersampling; canvas resources, click handling and grid clocks remain live.
The other desktop worker/fallback and phone streams capture the whole scene.
Earlier sparse captures that missed intermediate frames remain in the evidence.

Fresh local Lighthouse 13.4.1 performance audits:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.33 s | 0.52 s | 0 ms | 0.00019 |
| Mobile | 100 | 1.14 s | 1.37 s | 0 ms | 0.00033 |

Both audits have no warnings. These measure local startup; interactive motion
and low-end budgets are checked separately. Scores can vary across devices
and audit conditions.

Evidence is under `grid-edge-wipe-2026-10-10/`: the recording findings, frames
and palette/grid traces; `baseline-coverage.json`; `motion-and-playback.json`;
`final-regressions.json`; `check-summary.json`; edge measurements/screenshots;
and desktop/mobile HTML and JSON Lighthouse reports. The recording uses
`localhost:4173`, while these checks use the existing `127.0.0.1:4175` preview.
Both the main checkout and Codex worktree have matching fix sources and rebuilt
production assets. Existing service-worker updates retain their visitor-approved
Update/reload behavior, so an already-open cached page must load the new build.

## Hardware-rendered grid wipe fix — October 11, 2026

This verification supersedes the earlier wallpaper mask candidates above.
The complete first-party application, UI, worker/fallback rendering, hooks,
utilities, styles, pages, startup/build configuration and regression code were
reviewed. The baseline inventory contains 113 files; the new surface and its
lifecycle tests were also reviewed. Inventory and detailed audits are in
`theme-codebase-audit-2026-10-10/` under the artifact directory above.

The supplied straight horizontal palette cutoff was reproduced with actual
AMD Radeon 780M/Mesa hardware compositing and rasterization. Software-rendered
checks had missed it. Full-viewport hardware captures also rejected the native
circle/promotion and bounded-path candidates. The failing composition combined
an animated wallpaper clip with separately transformed, gradient-masked grid
children. The exact Chromium/driver internal defect is not established; the
captured rectangular cutoff and large palette reversals establish the failure
of that rendering composition independently of theme state or stale caching.

During a wipe, the wallpaper now uses one temporary opaque 2D paint surface.
Both palettes and the exact shared circular boundary are painted together.
Original grid nodes and CSS animation clocks remain connected and running;
their measured tile position, parallax, drift, opacity and fade geometry supply
the surface. Cleanup restores the original wallpaper, removes temporary layers
and explicitly clears the canvas backing store. Floor, cube, text and cursor
tracking retain their existing shared-circle behavior.

The background now paints even when a renderer handoff briefly removes the cube
canvas. Resize, reduced-motion changes and hidden tabs finish and release an
active wipe; App unmount cancels the owned wipe. Normal theme-state rerenders
keep it running. Preparation is covered by the existing exception cleanup.
Separate preexisting asynchronous snap/profile-change edge cases are described
in the implementation audit; they were not demonstrated causes of the recorded
simple-click cutoff.

The backing store is limited to CSS pixels and allocated only during the
two-second transition: about 1.38 MB for a 430×800 phone and 13.3 MB at 2536×1310,
independent of DPR. There is no extra WebGL context/pass, idle rendering loop,
or startup canvas allocation. The GPU captures verify hardware compositing and
rasterization; this machine reports software 2D canvas painting. Existing device
budgets, responsive branding, desktop scrubber, cube motion and local changes
are retained.

Final verification on the production build:

- 39 complete, unpaused two-second hardware-rendered wipes pass across the
  recorded desktop, its DPR 2 variant, worker/fallback desktops and a DPR 3
  fallback phone with simulated 2 cores/2 GB and 6× CPU throttling. All captures
  include the full viewport and cube. The 9,608 frames include 792 mixed-palette
  frames; maximum reversal is 0.073 percentage points and maximum fitted-circle
  mismatch is 0.088%, within JPEG/edge sampling noise. No rectangular palette
  dropout is detected.
- All 55 focused regression checks pass. They cover 840 background/ground/
  branding pixel comparisons, 72 edge/corner radii, 23,053,183 dense background
  palette checks with zero mismatches, and 1,548 line-presence bands. Original
  animation identity/continuity, cube resources, responsive layouts, cursor UI,
  idle/device budgets, temporary canvas detachment, resize/reduced-motion
  recovery and DPR-bounded backing release pass.
- The additional hidden-tab interruption and subsequent theme flip pass.
- Production build, focused ESLint (including App and all new/changed wipe
  modules/tests/configuration) and whitespace checks pass.

Fresh local Lighthouse 13.4.1 startup performance audits:

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.39 s | 0.54 s | 0 ms | 0.00019 |
| Mobile | 100 | 0.76 s | 0.98 s | 0 ms | 0.00033 |

Both audits have no warnings. These are local startup measurements, not a
guarantee for every physical device or network; interactive playback and
simulated low-end budgets are verified separately above.

Evidence is in `grid-surface-2026-10-11/`: `surface-implementation-audit.md`,
`gpu-playback-summary.json`, renderer/capture JSON and JPEGs in `gpu-smoke/` and
`gpu-repeated/`, `regressions.json`, `regression-measurements.json`,
`hidden-interruption.json`, and desktop/mobile Lighthouse HTML and JSON reports.
A dedicated temporary production preview on port 4186 was used for these checks;
the user's preview servers were not changed. Main-checkout integration verifies
the captured original file hashes before copying the fix, preserves existing
commits/local changes, and rebuilds matching production assets.

## About GSAP and scrollbar audit — October 19, 2026

The production build containing the current About scroll reveals, independent
certificate-thumbnail exits, and calendar scrollbar fixes retains a Lighthouse
Performance score of **100/100 in all three desktop and all three mobile runs**.
The values below are medians across those runs.

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 0.36 s | 0.58 s | 1.5 ms | 0.00021 |
| Mobile | 100 | 0.99 s | 1.38 s | 18.5 ms | 0.00103 |

Lighthouse 13.4.1 ran against an isolated local production preview using its
official desktop and default mobile presets, with fresh Chrome profiles and
sequential runs. Network/CPU settings were not relaxed. All six reports have no
run warnings. A 100 score does not mean every diagnostic is clear: navigation
reports still flag approximately 21 KiB of potentially unused vendor JavaScript,
and one desktop run reports forced layout work.

The production build succeeds, focused ESLint and whitespace checks pass, and
all 10 About regression tests pass. Coverage includes desktop, both themes,
phone, tablet, portrait monitor, low-end phone, reduced motion, two narrow
mouse-controlled calendar viewports, and first-load progress. A separate
production-preview desktop About smoke test also passes.

### About scrolling beyond the navigation score

Separate runtime checks open About through the cube, scroll the native panel
fully down and up, and repeat after deferred content settles. They load the
real GitHub contribution data and PDF without network mocks. The desktop profile
is 1440×900 at DPR 1 and 1× CPU; mobile is 390×844 at DPR 2 with live 4× CPU
throttling. Runtime networking is unthrottled. Native wheel input drives both
profiles; physical touch inertia is not measured.

Without Lighthouse trace recording, repeat scrolling has **zero long tasks
over 50 ms and zero layout shifts** in both profiles. First scrolling includes
one 107 ms task on desktop and two tasks of 52–53 ms on mobile. The cube reports
that rendering is paused while About is open. The calendar and PDF render, with
no page errors, console warnings/errors, or failed requests recorded.

**Remaining issue:** deferred content causes a first-scroll layout shift. The
mobile Lighthouse interaction trace reports CLS 0.166, attributed to movement
of the GitHub activity section. An independent pass without tracing reproduces
a single layout-shift event of 0.235. Desktop first scrolling also shifts.
Repeat scrolling has no shifts in either profile; navigation-only scores do
not expose this problem.

A likely contributor is `DeferredSection` releasing its reserved minimum height
as soon as it enters view while the PDF's `Suspense` fallback is null. Keeping
that space reserved until the viewer is ready, together with a stable calendar
loading placeholder, is follow-up work. This cause needs an isolated fix to
confirm; the audit does not establish GSAP as the sole source of layout work.

The runner is headless Chrome 154 with ANGLE SwiftShader software rendering,
confirmed through Chrome SystemInfo. Lighthouse tracing noticeably increases
runtime overhead, so the no-trace repeat supplies the timing comparison.
requestAnimationFrame callback intervals are not presented-frame FPS. These
results do not guarantee frame rate on every physical device or measure the
deployed site's CDN/network delivery.

The local audit artifacts are in `gsap-performance-2026-10-19/`, including six
navigation HTML/JSON reports, desktop/mobile About user-flow reports, traced and
untraced runtime measurements, the tested build hashes, and audit scripts.
Those generated reports are kept outside the application bundle.


## Covered-scene resize and closing flash — October 21, 2026

Resizing while About or Skills was open could clear the paused WebGL buffer. The overlay then exposed the homepage before the returning cube was rendered. The fallback also allowed a responsive React update to reapply the resting cube position over the held navigation pose.

Both renderers now repaint a held frame after viewport/profile changes without advancing the transition or starting an idle loop. Completed approaches refit the zoomed camera to the new viewport. The fallback's declarative initial position stays stable, so only its animation code changes the live pose. Early-close camera poses remain interrupted rather than snapping to a completed approach.

The new covered-resize regression reproduced the missing pixels before the fix in both renderers. It checks the actual canvas image repeatedly after desktop-to-phone, phone-to-tablet, and tablet-to-desktop changes, verifies a painted zoomed face survives compositing, checks worker draws settle, and closes cleanly. It covers About in Demain Soir Bleu and Skills in Clair Obscur with both worker and fallback rendering.

Sixteen distinct browser checks are verified: four covered-page resize cases, six home-resize profiles, and six transition profiles. One initial desktop-fallback timing check missed an overlapping opacity sample under parallel load and passed in the final targeted run. Build, focused ESLint, and whitespace checks pass. No new Lighthouse score is claimed for this update. Evidence: `/tmp/dinoweb-covered-resize-repro`, `/tmp/dinoweb-covered-resize-final`, and `/tmp/dinoweb-covered-resize-confirmed`.
