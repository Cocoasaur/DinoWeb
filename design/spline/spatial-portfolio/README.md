# DinoWeb spatial portfolio — work in progress

Editable scene: [DinoWeb — Spatial Portfolio](https://app.spline.design/file/605da011-49e7-4339-9117-24f37c21281f).

## Saved in Spline

A separate 3D scene with 70 objects: an architectural gallery, profile exhibit, four-layer skills installation, project workstation, and contact desk. Materials use cobalt, limestone and brushed metal. The original starter file is unchanged. A root perspective camera and Mouse Up sensors have been added.

The scene has NOT passed visual or interaction acceptance. Earlier screenshots revealed malformed wall typography; its replacement decal currently reports an empty projection and must be removed or repaired. Other 3D text also needs close-up review. Mobile camera framing and performance are unverified.

## Source status

Files 01–08 record the applied editing passes. These are editor DSL scripts, not JavaScript modules for the website. Do not run the sequence blindly against the existing scene: it contains authoring history, removed objects, and material creation that would duplicate content. Pass 03 records the corrected successful version; earlier failed diagnostic attempts made no substantive geometry changes.

`09-draft.spline.js.txt` was NOT applied. The daily Spline quota rejected it. It starts by removing the empty decal and proposes individual extruded letters as a replacement; review the actual scene before applying it.

`gallery.draft.html` is NOT attached to Spline. It prepares camera navigation, four content views, project selection, restrained skills motion, keyboard controls, pause/reduced-motion support, touch drag, and static contact links/copy. Its embedded module passes `node --check`; the actual Spline bridge, pointer events and camera framing have not been tested. No claim of working interactions is made yet.

## Resume

1. Reopen the scene UUID above and inspect its actual hierarchy and camera before editing. Do not create another file.
2. Repair/remove the empty decal and finish readable typography. Verify exhibit positions and skill rig parents.
3. Attach the draft HTML, enter Preview, verify camera travel and object interactions with captures at two different times, and fix bridge errors. Test portrait framing, touch drag versus tap, keyboard and reduced motion.
4. Return to Edit, compose the final user view and take a live hero capture. Analyze scene cost before calling the scene ready.
5. Only after review, obtain a runtime code export and configure `VITE_SPLINE_SCENE_URL`. The local prototype currently still has no real export configured. Publishing/export is not completed by these source files.

The Spline server stopped accepting calls at its Free-plan limit of 20 calls on 2026-10-24. It reported a reset at 2026-10-25 00:00 UTC (08:00 Asia/Manila). No further Spline calls should be retried before that reset unless the account limit changes.
