# Portfolio performance validation

Validated October 5, 2026 with Lighthouse 13.5.0 and Chrome 154 against the
user-started production preview at `http://localhost:4173/DinoWeb/`. The final
changes are integrated into `/home/jl/Documents/JL/Code_Projects/DinoWeb_3D`.
No development or preview servers were started or stopped during this work.

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100 | 100 | 100 | 100 | 0.21 s | 0.55 s | 0 ms | 0.00015 |
| Mobile | 100 | 100 | 100 | 100 | 0.80 s | 0.95 s | 39 ms | 0.00093 |

These are local startup audits using software WebGL. Their paint metrics include
the initial loading UI; interactive-cube readiness is checked separately below.
The loading screen appears on every refresh and real 3D starts automatically.
There is no static cube or interaction-triggered activation. Scores can vary
with the device and hosting; they do not guarantee a frame rate during use.

The HTML/JSON reports and a video of the slow transitions are saved in
`/home/jl/.codex/visualizations/2026/10/04/01a10732-0c71-75b1-930b-235ade9c735f/`:

- `lighthouse-enlarged-floor-desktop.report.html` and `.json`
- `lighthouse-enlarged-floor-mobile.report.html` and `.json`
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
- The perspective floor spans the viewport and reaches approximately 25% of
  its height, about twice the previous visible depth. Larger 100–160 px grid
  tiles and viewport-scaled perspective match the reference's broad baseplate.
  The loading screen shares these styles, without adding assets or GL draws.
- The home baseplate reacts to a fine-pointer cursor with ±3° pitch, ±1.4°
  roll, small perspective shifts and matching shadow movement. Pointer events
  coalesce into one transform update per animation frame, with a 480 ms ease.
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
reaches its maximum in 240 ms on desktop or 180 ms on mobile/low profiles. As
soon as the blur completes and the real page is ready, its opacity dissolve
starts while the camera continues its slow approach. There is no wait for camera
completion before page loading or fading. The scene pauses only after both the
camera approach and page dissolve finish.

Closing holds the camera at its final or interrupted approach pose throughout
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
  0 ms desktop / 19 ms mobile blocking time. The latest enlarged-floor runs
  appear in the table above, with 0 ms desktop / 39 ms mobile blocking time.
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
