# Next-session handoff

Saved October 11, 2026 after the user confirmed that the rendering glitch is fixed.

The working project is `/home/jl/Documents/JL/Code_Projects/DinoWeb_3D` on `main`.
The Codex checkout is `/home/jl/.codex/worktrees/32d0/DinoWeb_3D`.
This series preserves the existing history through `bfdef5e` and commits the
previously pending fixes. Product source and the verified production output are
unchanged by the commit preparation. Both checkouts will contain the same final
source. No project preview server was started or stopped for this preparation.

## Behavior to preserve

- Mobile/tablet DINOWEB remains a staggered group: DINO upper left, version text
  upper right, WEB lower right, dev-den text lower left. Center the entire group
  horizontally. The cropped SVG bounds and shared `getHomeComposition` values
  coordinate the text, metadata, corner markers, sidebar and cube placement.
- Keep the desktop cursor-Y scrubber inside the viewport. Its visibility is
  independent of the desktop rendering-quality tier; mobile, reduced motion
  and the existing tablet visibility budget retain their current behavior.
- Cube body, labels and accents change per fragment along the circular wipe in
  both worker and fallback renderers. Preserve the actual cube canvas/resources,
  prewarmed label atlases and existing motion; do not restart them on theme flips.
- Wallpaper theme transitions use one temporary opaque 2D paint surface with
  the same circle as the cube. Original CSS grid nodes and animation clocks stay
  connected and running under hidden source opacity. Their measured tile phase,
  drift, parallax, opacity and fade supply the surface. The backing store uses
  CSS pixels, is allocated only during a wipe and is explicitly cleared afterward.
- Do not restore the nested animated wallpaper clip/transform/gradient-mask
  stack: its straight horizontal palette dropouts were reproduced on the GPU.
  Native circles, bounded paths and promotion alone did not resolve that failure.
- Keep the CSS ground grid, floor pool/shadow palette variables, chrome copies,
  SVG paint-ID scoping and original theme-label text-node identities intact.
- Keep wallpaper painting independent of cube-canvas presence. Resize, hidden
  tabs and reduced-motion changes finish/release an active wipe; App unmount
  cancels it. A normal theme-state rerender must not cancel the running wipe.
- Preserve device DPR/texture/effect limits, demand rendering and zero added idle
  WebGL draws. The wallpaper surface adds no startup canvas or idle render loop.

## Verified baseline

The user accepted the final visual fix before this commit series. The unchanged
build passed 39 full-duration hardware-rendered wipes, 55 focused regression
checks and one additional hidden-tab recovery check. Captures contain 9,608
frames, including 792 mixed-palette frames. Dense edge checks sampled 23,053,183
background pixels with zero palette mismatches and 1,548 grid-line bands.
Worker/fallback desktops, DPR 2 recorded desktop, DPR 3 phones and simulated
2-core/2 GB mobile at 6× CPU slowdown are covered.

Fresh local Lighthouse performance scores are desktop 100 and mobile 100, both
with 0 ms total blocking time and no audit warnings. Desktop FCP/LCP: 0.39/0.54 s;
mobile FCP/LCP: 0.76/0.98 s. These are local startup scores, not guarantees for
all devices/networks or measurements of interaction frame rate.

See [performance validation](performance-validation.md#hardware-rendered-grid-wipe-fix--october-11-2026).
Full evidence is in
`/home/jl/.codex/visualizations/2026/10/08/01a11b9d-fab2-7fc3-8f18-04f178854d21/grid-surface-2026-10-11/`.
The full first-party audit inventory and earlier recordings/reproductions are in
`theme-codebase-audit-2026-10-10/` beside that directory.

## Starting tomorrow's fixes

Inspect `git status` and preserve any new local changes. Work from the main
project directory and verify which build the user's current preview serves.
An already controlled PWA can retain its prior build until Update/reload; do
not diagnose stale caching without checking the loaded asset/worker identity.
Do not replace the current visuals with a different mobile text arrangement.

For relevant regression checks, use the current production preview URL through
`PLAYWRIGHT_BASE_URL`, and run the wipe, grid, layout and scrubber specs appropriate
to the new change. For hardware playback, set
`PLAYWRIGHT_REQUIRE_HARDWARE_GPU=1 PLAYWRIGHT_REQUIRE_FULL_CAPTURE=1` and run
`theme-recording.spec.js`; that suite asserts actual GPU compositing/rasterization
and full-viewport captures. Default software-rendered passes alone previously
missed this intermittent failure. Run CPU-throttled/mobile checks and fresh
Lighthouse when a new change affects rendering/startup cost.

Known separate gaps from the audit: cancellation of an asynchronously prepared
snap fallback, portfolio-only VisualViewport changes, and profile/label-scale
changes during an active wipe are not fully hardened. They were not established
causes of the accepted simple-click GPU cutoff. Reproduce new failures before
changing unrelated paths. Vite may reorder generated JS preload tables between
identical-source builds; the final saved production assets match the exact
GPU/Lighthouse-tested output.

## Commit series

Run `git log --oneline bfdef5e..HEAD` in the main checkout for the commit IDs.
The series is organized as follows:

1. fix(layout): share responsive composition between cube and home chrome
2. fix(branding): crop mobile SVGs to their painted glyph bounds
3. fix(scrubber): give the cursor marker a visible horizontal footprint
4. fix(scrubber): preserve the desktop control across device quality tiers
5. test(layout): guard responsive alignment across viewport boundaries
6. test(scrubber): verify desktop visibility and cursor tracking
7. feat(theme): define floor pool and shadow palettes as CSS variables
8. fix(floor): consume captured pool and shadow palette variables
9. refactor(floor): keep theme gradients out of React inline styles
10. fix(grid): remove the discrete promotion hint from drift keyframes
11. feat(wipe): bound circular paths to their viewport rectangle
12. test(wipe): cover bounded-circle edge and corner geometry
13. fix(grid): paint both wallpaper palettes in one temporary surface
14. feat(wipe): define bounded wallpaper and chrome layer wrappers
15. feat(wipe): preserve live backdrop motion and release temporary palettes
16. refactor(home): wrap wallpaper and chrome for coordinated palette reveals
17. fix(theme): drive cube and backdrop from one live circular wipe clock
18. fix(theme): cancel the owned wipe when the app unmounts
19. test(grid): compare wallpaper ground and branding pixels across the wipe
20. test(grid): reject palette gaps at moving edge and corner crossings
21. test(grid): verify canvas handoff interruption and backing release
22. test(theme): keep grids and branding visible during unpaused playback
23. test(playback): analyze capture geometry and fit the observed circle
24. test(gpu): enable the hardware compositor validation path
25. test(theme): capture complete repeated hardware-rendered wipe sequences
26. docs(layout): record responsive composition validation
27. docs(branding): record the centered staggered lockup hotfix
28. docs(scrubber): record desktop cursor bar validation
29. docs(theme): record background and ground palette synchronization
30. docs(wipe): retain the earlier compositor experiments and their evidence
31. docs(perf): record the confirmed GPU fix and final mobile desktop audits
32. docs(handoff): preserve the verified baseline for the next fixes
