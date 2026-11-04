# Current portfolio recreation in Spline — unfinished

Editable file: https://app.spline.design/file/605da011-49e7-4339-9117-24f37c21281f

## User requirement

Clear the existing 3D workspace and recreate the current DinoWeb portfolio faithfully. Reuse the existing design and artwork; do not invent another gallery, room, desk or visual direction. Pixel-level fidelity is the acceptance target, not a verified result.

## Saved on 2026-10-26

The old 70 gallery objects were removed in the existing file. Its new hierarchy has 13 objects: the native rounded cube body, six face-marker meshes, their pivot group, a separate perspective play camera, three existing-style lights, and a theme backdrop. The old gallery material assets remain unused and need cleanup. A failed empty decal was removed; no empty decal remains in the hierarchy.

A 702,370-character standalone HTML document is attached as the scene's code layer. It reuses the actual App, pages, wordmarks, typography and styles, replacing the Three.js renderer with `SplineCubeStage.jsx`. It does not instantiate another WebGL renderer. Existing image assets are read from the published source commit `7e22b12babe648dbb442c95fc2dce78d4356651d`. Fonts are embedded. The existing PDF viewer is retained with its worker pinned to pdfjs-dist 5.4.296 on jsDelivr. Storage writes in ThemeContext are guarded for Spline's sandboxed document, without modifying the production component.

The original cube image and label atlases are applied by a runtime material through Spline's HTML bridge. This material path needs WebGPU and inline Preview support; it is not validated for the legacy Play overlay or Viewer embeds. The authored Edit-mode cube does not yet show that runtime artwork. This is an unresolved limitation, not a finished substitute for the original design.

## Verification and limits

Thirty screenshots and computed layout/typography/color measurements cover the original homepage and first views of all four pages, in both themes at 1440×900, 820×1180, and 390×844. These are initial views, not complete scrolled-page captures.

Local checks using a controlled Spline bridge passed startup, original material construction, Projects opening, the original five-card layout and closing back home, with no application errors. The desktop wordmark bounds exactly matched the source (x 60, y 330.8515625, width 633.59375, height 140.796875). These controlled checks DO NOT establish a working native Spline runtime or pixel-perfect rendering.

The actual Spline captures exposed a small plain cube in Play and incomplete composition/artwork. Its capture tool omits the HTML UI. The final Edit-mode camera check shows the cube clearly, but pixel fidelity, the combined inline Preview, all page transitions, touch/pinch handling, ambient cube motion and performance are NOT accepted. The scene was returned to Edit mode. No scene was published, no runtime export was configured, and the deployed portfolio was not changed.

The Spline Free account reached its 20-call daily limit. The reported reset is 2026-10-27 00:00 UTC / **08:00 Asia/Manila**. Do not retry quota-limited scene calls before the reset. A user question is pending asking what appears in Preview and for any Console error text.

## Rebuild the attached code layer locally

From the repository root:

```sh
node design/spline/portfolio-match/build.mjs /tmp/dinoweb-spline-current
```

This emits `portfolio.html` (the compact document for Spline), `portfolio.full.html`, `portfolio.bundle.js`, and `portfolio.css`. The document requires Spline's injected `window.spline` bridge; opening it by itself is not a live scene test. A local mock may test UI/control integration but must never be presented as verification of the native Spline scene.

## Next actions

1. Open the same file, inspect Preview and the Console strip, and obtain the actual runtime error/state before changing the document. Do not reset the scene again.
2. Resolve original artwork/material support and responsive camera framing in the real inline Preview. Review the role of the theme backdrop in camera fitting, and keep the editor camera independent from the scripted play camera.
3. Re-read the attached HTML before changing it. Preserve the uploaded source and apply targeted edits. Remove unused gallery materials only after checking they still have zero users.
4. Compare the combined native scene plus HTML against the reference at the same viewport in both themes. Verify About, Skills, Projects and Contact, drag versus tap, pinch, hover, theme transitions, dissolve, shadow and grid persistence. Add missing behavior from the existing portfolio; do not add new styling.
5. Repeat the required live scene and interaction checks. Obtain a runtime export or publish only when the user requests it; keep the ordinary homepage untouched until the real Spline output is accepted.
