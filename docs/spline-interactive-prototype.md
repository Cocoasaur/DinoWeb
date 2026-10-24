# DinoWeb: Spline spatial portfolio prototype

## Direction

Build an architectural 3D gallery with four destinations: a profile exhibit, layered skills installation, project workstation, and contact desk. The actual scene is being authored in Spline, rather than treating the existing cube plus flat pages as a finished 3D portfolio. Keep DinoWeb’s cobalt/monochrome identity and existing project, skill and contact data.

Editable file: [DinoWeb — Spatial Portfolio](https://app.spline.design/file/605da011-49e7-4339-9117-24f37c21281f).

The prototype is isolated behind `?prototype=spline` on `page-redesign-implementation`. The ordinary homepage is unchanged. See [scene source and handoff](../design/spline/spatial-portfolio/README.md) for applied build passes, unapplied interaction code and exact remaining work.

Stable destination names are `DinoWeb_Panel_About`, `DinoWeb_Panel_Skills`, `DinoWeb_Panel_Projects`, and `DinoWeb_Panel_Contact`. They now identify exhibit groups. The current child-mesh sensors do not yet satisfy the React integration’s exact panel-name event contract; resolve that during actual runtime integration.

## Interaction

The planned scene interaction uses eased camera travel between exhibits, a layered skills sculpture, project switching and touch drag. HTML navigation provides accessible destinations. These behaviors are prepared locally but remain unverified in Spline Preview. Reconcile scene navigation with the existing React overlay routes when connecting the real export.

Closing a page must restore the selected camera pose before returning to the wider navigation composition. Preserve this pose explicitly so the earlier camera-reset behavior cannot reappear. Rapid selections should replace an in-progress movement, not queue more movements.

Keyboard navigation remains ordinary DOM links/buttons with visible focus. Reduced motion uses immediate selection and a stable camera. Native scrolling belongs to the page overlay; the scene must not trap its touch gestures.

## Motion and integration

Author scene structure in Spline with pivots at motion origins. Follow the plugin’s code-driven animation guidance: one motion clock, cached object references, eased poses, and cleanup on stop/unmount. Inactive or hidden scenes should stop scheduling frames. Only add ambient motion if profiling shows room for it.

Create the scene in Spline’s editor first. Inspect its actual object structure, refine framing and composition, then refine materials and lighting with screenshots. Verify interactions in Play mode and return the editor to Edit mode afterward.

Connect the actual scene export to React only after it exists and its event/object contract is verified. Keep the portfolio’s existing page content and theme data as the source of truth. Compare the current local 100/100 desktop and mobile homepage Lighthouse baseline with the integrated prototype, and separately measure scene responsiveness; a navigation score alone does not establish smooth 3D interaction.

## Review checklist

- All four destinations are visible on desktop, tablet, phone, and portrait layouts.
- Mouse, finger, keyboard, and reduced-motion selection remain usable.
- Panels settle level enough to read; the scene has one clear visual focus.
- Opening and closing existing pages preserves the focused camera pose.
- Repeated interaction does not accumulate animation loops or handlers.
- Scene screenshots, interaction checks, and performance results are recorded before replacing the production navigation.

## Local integration

Open the experiment at `/DinoWeb/?prototype=spline`. The ordinary `/DinoWeb/` entry continues to use the current portfolio. The experiment does not instantiate the existing Three.js stage. Its Spline runtime chunks live under `assets/spline/` and are excluded from service-worker precaching; they are requested only when a configured scene is mounted.

1. Create or open your editable **3D Scene** in Spline. The Hana 2D editor is a different product.
2. When the scene is ready, use **Export → Code → React** and copy the exact `.splinecode` URL. A dashboard, editor, share, or Community link is not a runtime export and cannot be converted into one locally.
3. Copy `.env.example` to `.env.local`, then set `VITE_SPLINE_SCENE_URL` to that URL. This is public build-time configuration, not a secret.
4. Restart `npm run dev`, or run `npm run build` again if using `npm run preview`.
5. Open the prototype URL above. Missing/invalid configuration leaves a clear placeholder and working page navigation.

Alternatively, put a downloaded code export at `public/spline/scene.splinecode` and set `VITE_SPLINE_SCENE_URL=spline/scene.splinecode`. Relative paths resolve under Vite’s `/DinoWeb/` base, including in a preview accessed from a phone. Other assets requested by the export must also remain available. The runtime may load auxiliary assets from Spline’s CDN, so this is not yet a promise of fully offline operation.

React manages `@splinetool/runtime` directly to control resize, aborting a failed load, pause/resume, and disposal. It uses automatic on-demand rendering and leaves Spline HTML content sandboxed. Errors, context loss, and a 25-second loading deadline produce a retry option without removing the ordinary navigation. The Spline credit remains visible whenever a scene is enabled.

## Scene contract

The panel groups now exist in the partial gallery scene. Their exact event contract remains to be verified and reconciled with the React listener before configuring an export. Add an editor-authored **Mouse Up** event on each named panel: runtime listeners only receive events the scene defines. Hit targets must report the panel name, including when tapping its label. Hover, finger feedback, rotation, framing and camera animation still need to be authored and tested in Spline.

The browser integration opens the corresponding existing React page when the panel event is received after a tap. Pointer movement over 8 CSS pixels, leaving the scene, cancellation, or a secondary pointer invalidates that selection. DOM buttons provide an independent keyboard/touch route to the same pages. Overlay focus is trapped and restored, and Escape closes the page.

The scene stays mounted while an overlay is open and rendering/events are paused. It resumes after the overlay closes, preserving the same runtime/camera rather than resetting to a new application. The browser also pauses the scene when hidden or when the visitor presses Pause. Reduced motion does not mount the animated scene and retains all four page buttons; this does not depend on the scene honoring a custom variable.

Optionally author a string variable named `DinoWeb_Theme` with `clair-obscur` and `demain-soir-bleu` values. The app updates it when the theme changes, but the scene must implement its own material/color response. Without that variable only the surrounding portfolio UI changes theme.

## Validation

Build and lint the changed sources. The missing-export browser suite checks desktop, touch phone and portrait/reduced-motion tablet navigation through all four pages, modal focus, theme switching and renderer isolation:

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4174/DinoWeb/ npx playwright test tests/e2e/spline-prototype.spec.js
```

The configured boundary tests use a controlled runtime fixture for lifecycle, gesture classification, resize, retry and timeout. One separate case loads the actual runtime with an intentionally failed scene fetch. They **do not verify a real rendered scene**. To run them, start a separate dev server with `VITE_SPLINE_SCENE_URL=spline/test-scene.splinecode` and pass its prototype URL in `PLAYWRIGHT_SPLINE_URL`:

```sh
VITE_SPLINE_SCENE_URL=spline/test-scene.splinecode npm run dev -- --host 127.0.0.1 --port 4176 --strictPort
PLAYWRIGHT_SPLINE_URL='http://127.0.0.1:4176/DinoWeb/?prototype=spline' npx playwright test tests/e2e/spline-runtime.spec.js
```

The configured suite skips when `PLAYWRIGHT_SPLINE_URL` is absent. Lighthouse checks of the unchanged homepage cannot establish the eventual Spline scene’s performance; repeat them on a real export and separately profile its interactions before promoting this experiment.

### Latest local results (2026-10-24)

- Production build: passed. ESLint for changed entry, prototype, tests and Vite configuration: passed.
- Eight Chromium browser checks: passed, including desktop, phone, portrait tablet, existing page overlays, keyboard focus, simulated runtime lifecycle and a failed fetch through the real runtime.
- Standard Lighthouse 13.4.1 homepage audits: desktop **100**, mobile **99**. The unchanged `e0a64bb` baseline measured **100** on mobile with the same installed dependencies and browser. Do not claim a maintained mobile 100 or that the future Spline scene is performance-verified.
- Current mobile metrics: FCP 1.36 s, LCP 1.95 s, TBT 0 ms, CLS below 0.001; no Lighthouse run warnings.
- Reports: `/tmp/dinoweb-spline-lighthouse/desktop.report.html` and `/tmp/dinoweb-spline-lighthouse/mobile.report.html`. Browser output: `/tmp/dinoweb-spline-tests/`.

## Current status

A real 70-object 3D gallery is saved in Spline, separate from the starter file. Scene authoring was interrupted by the account’s daily 20-tool-call quota on 2026-10-24. The reported reset is 2026-10-25 08:00 Asia/Manila.

The scene needs typography/decal cleanup, Preview interaction checks, responsive camera verification and a final live visual check. Navigation/motion HTML is saved as a syntax-checked local draft; it has not been attached to the scene. No runtime code export is configured, and the local prototype still shows its placeholder. No scene-specific Lighthouse or runtime performance result is available.
