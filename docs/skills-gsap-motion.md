# Skills page motion and layout

The Skills page uses an editorial grid and a CSS 3D sculpture of four toolkit layers. The shared catalogue in `src/data/skills.js` supplies the sculpture, category filters, counts, and all 25 tools from the previous page. No proficiency scores are inferred.

`src/hooks/useSkillsMotion.js` owns the GSAP contexts. The intro starts after the overlay opens. The sculpture reacts to mouse position, native panel scrolling, the spread control, and category selection. It uses transforms and short, reusable pointer tweens; it adds no WebGL renderer, dependency, or idle animation loop.

The hero text, totals, buttons, sculpture, labels, category controls, catalogue content, and footer reveal at the lower viewport edge, rest fully readable in the middle, and exit upward. `src/utils/scrollRevealBounds.js` supplies the same measurements to About and Skills: entry from 96% to 84% of panel height, then exit from 34% to 8% measured from the top. The filter bar scrolls with the page so it can share these boundaries. Scrolling back restores it. Stationary wrappers supply layout measurements, so animation transforms cannot change trigger geometry or move the grid rules. Animated tool faces stay clipped inside their own cells. Resize and font loading refresh the measurements, and filtering or closing the page cleans up the previous scroll triggers and listeners.

The grid adapts from three tool columns on desktop to two on tablets and phones. Phones stack the hero and sculpture. The close control and reading-progress indicator stay available while content scrolls. The outer overlay uses `overflow: clip` so focus and native scrolling cannot move the centred panel toward the browser edge. Explore toolkit scrolls only the native panel, preserving the same top and bottom gap as About. Reduced-motion mode shows the content immediately and changes sculpture state without tweening. Mobile and lower-capability profiles use shorter translations and smaller layer spacing; the lowest tier skips mouse-hover tilt but keeps gentler finger feedback.

Validation command (against an already running local server):

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4187/DinoWeb/ npx playwright test tests/e2e/skills-animations.spec.js --workers=2
```

The browser suite covers desktop, short desktop, the blue theme, phone, tablet, portrait monitor, small phone, landscape phone, and reduced-motion/low-capability profiles. It checks filtering, sculpture depth, upper-edge exits and reversal across the hero, controls, sculpture, headings, tools, and footer, every tool's readability and icon, horizontal overflow, and closing/reopening through the real cube navigation. On 20 October 2026, all nine Skills profiles and all ten About regression checks passed against the production preview. The Skills checks also cover keyboard filtering and the shared lower entry and upper exit bands. Run both suites after changing the shared helper. The production build, focused ESLint checks, and `git diff --check` also passed. These are functional and layout checks; no new Lighthouse score is claimed.

The container-spacing regression checks equal top and bottom gaps after toolkit navigation, filters, keyboard focus, and scrolling.

Release validation: changed JavaScript files pass ESLint. Repository-wide lint still includes generated `.vite` cache errors; excluding that cache leaves 15 existing source errors in eight files identical to `origin/main`.

## Tablet and phone interaction

Tool cards reuse the same `TiltCard` as the About portrait. Tap or drag a card for feedback; release, cancellation, page scrolling, or resizing settles it back to its neutral pose. GSAP still owns the outer reveal wrapper, so the touch tilt cannot overwrite the scroll animation. Idle cards skip scroll-driven style writes.

The layer stack supports mouse hover, single-finger taps and horizontal drags, and pen input. Its resting rotations come from the original CSS pose rather than hard-coded angles, so it settles precisely after a gesture. A second finger, cancellation, native scrolling, resizing, or window blur cancels the interaction. Timers and listeners are removed when the page closes.

Both interaction surfaces allow native vertical panning and pinch zoom. No touch handler calls `preventDefault()` or captures the pointer. Touch controls have at least 44px height, and reduced-motion mode keeps controls usable without tilt feedback.

`tests/e2e/skills-touch.spec.js` sends native Chrome touch input in phone, tablet, landscape, low-capability, and reduced-motion profiles. It covers press/drag/release, multi-touch cancellation, vertical finger scrolling over both surfaces, real taps on filters and the spread control, and closing the page. The missing layer-stack touch feedback was reproduced before the fix.

Touch-update validation: 18 production-preview browser checks passed (nine Skills layout/motion profiles, five finger-input profiles, mouse-hover/reduced-motion switching, and three About regressions). Changed-file ESLint, production build, and whitespace checks passed. Touch checks use native Chrome input with emulated phone/tablet viewports; physical Safari devices were not tested.

## Individual 3D tile reveals

Every technology tile folds toward the reader from a recessed X/Y rotation and returns to a flat, full-opacity resting pose. At the upper exit band it tilts away and recedes again; reversing scroll restores the same pose without restarting an independent animation. Desktop uses a 52-degree entrance and 40-degree exit around X, with smaller Y rotation and depth. Compact profiles retain the 3D cue at 32/26 degrees and shorter depth. The tile surface and inset rim move inside the stationary, perspective-enabled cell, keeping the editorial grid stable. Touch/hover tilt remains on the separate inner wrapper.

Tiles keep the shared About/Skills entry and exit boundaries. The effect animates only transforms and opacity, reuses the existing per-element timelines and triggers, and adds no idle loop or renderer. Reduced motion bypasses both scroll and pointer tilt, leaving all tools visible. Filtering and reopening revert the previous GSAP context.

3D-tile validation (21 October 2026): all 15 production-preview Skills checks pass. The nine layout/motion profiles now verify X/Y rotation and negative depth for every reachable tile entry/exit, a flat full-opacity resting pose, and restoration when scrolling back. Six interaction checks cover native finger input and mouse/reduced-motion changes. Production build, focused ESLint, and whitespace checks pass. A fresh Lighthouse Performance run per standard preset scores 100 desktop and 100 mobile; these remain local homepage navigation measurements, not scrolling frame-rate measurements. Evidence is saved outside the application in `/tmp/dinoweb-3d-tiles-tests` and `/tmp/dinoweb-3d-tiles-lighthouse`.

## Touch highlights

Skills opts into `TiltCard`'s touch highlight independently of tilt motion. A finger or pen press applies the desktop hover background and full-color icon; release keeps it visible for 500 ms. Cancellation, native scrolling, resizing, blur, and page cleanup clear it. Reduced-motion visitors get the same color feedback without a transform. Other uses of the shared card retain their original behavior. The outer tile flattens its pointer-tilt child above its surface so intersecting 3D planes cannot obscure the highlight.

The missing highlight was reproduced before the fix. Six production-preview touch/hover checks pass, including all 25 tools on phone, tablet, landscape, low-capability, reduced motion, release/cancel/scroll cleanup, and unchanged desktop icon hover. Evidence is in `/tmp/dinoweb-touch-highlight-final`.

Touch-highlight regression validation: eight additional production checks pass (three About profiles and five Skills layout/3D profiles), for 14 passing browser checks in this update. Build, focused ESLint, and whitespace checks pass. Native touch events are tested in Chrome phone/tablet emulation; physical Safari devices were not tested.

## Pinned page headers and blue-theme logos

About and Skills share a header frame in `Overlay`. Their masthead and close button sit above the native scrollport, so they remain visible throughout scrolling and neither custom desktop rails nor native phone scrollbars overlap them. The reading-progress line stays at the top of the content, immediately below the masthead. Page titles and body content retain their GSAP entry/exit behavior, with the existing shared bounds measured against the content viewport. The fixed masthead is excluded from scroll reveals.

In Demain Soir Bleu, all skill/tool icons use a white silhouette at rest. Fine-pointer hover or the existing touch-highlight state removes the filter to display the source icon's colors; release/cancellation/scroll cleanup restores white. Clair Obscur keeps its grayscale-to-color behavior. No icon files are changed.

The pinned-header helper checks header/close alignment and hit testing at the top, middle, and bottom of both pages. It checks that the scrollport and custom rail begin below the header, and that the shortened rail still reaches both ends of the scroll range. Theme tests cover all icons at rest on desktop, hover color, and a blue-theme phone tap/release.

Header/theme validation: 26 distinct production-preview checks pass (24 in the full run and two targeted About checks after updating their title-scroll geometry). Coverage includes desktop, both themes, phone, tablet, portrait monitor, narrow/landscape viewports, low-capability and reduced-motion profiles, calendar rails, all 25 tools, native finger feedback, keyboard rail endpoints, and close/reopen navigation. Production build, focused ESLint, and whitespace checks pass. Evidence is in `/tmp/dinoweb-sticky-headers-final` and `/tmp/dinoweb-sticky-headers-tall`.
