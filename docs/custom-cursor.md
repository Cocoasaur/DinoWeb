# Portfolio cursor

`src/components/ui/CustomCursor.jsx` provides a GSAP cursor using the portfolio's
corner brackets, precise point, theme colors, and small technical labels.
`src/styles/custom-cursor.css` owns its appearance.

The App lazy-loads it after the first scene frame when any available input
supports fine pointing and hover, with no reduced-motion preference or forced
colors. Its own media context uses the same query. Availability is independent
of window width and the WebGL performance tier, which can vary between browsers.
Hybrid devices can use a mouse alongside touch. Inside the portfolio viewport, the custom cursor replaces the native pointer after an actual mouse move has positioned its point and frame. The replacement becomes opaque before the active flag suppresses the native pointer. Touch events clear the active flag and hide the custom cursor.

## Interaction and lifecycle

- The center point follows the pointer directly; the bracket frame trails with
  reusable `gsap.quickTo()` tweens. During a press, both follow the pointer
  directly. Pointer movement does not update React state.
- Buttons and links expand the frame and show action labels. The cube's inline
  cursor, updated by its renderer, supplies rotate, open, zoom, and drag states.
  Other canvases, including PDF pages, use the default custom cursor state.
- The visual is portaled to `body`, ignores pointer events, and is hidden from
  assistive technology. Text fields use the custom TYPE pointer while retaining
  their normal text caret and editing behavior. Embedded frames and native media controls retain their own
  pointers. Add `data-cursor="native"` to any further native-control surface.
- `CustomScrollbars.jsx` replaces native thumbs on overlay panels, PDF viewers,
  and contribution calendars whenever the mouse cursor is enabled. The DOM
  thumbs capture pointer events on both axes, so the point and bracket frame
  remain exact throughout dragging. Wheel events and keyboard arrows, Page Up/
  Down, Home, and End scroll the real content; ARIA scrollbar values update
  with it. Wheel events at a nested viewer boundary chain to the outer panel.
  Pointer dragging suppresses the rail's focus outline while retaining focus
  for scroll keys. Keyboard navigation restores the visible focus outline.
- Rails are portaled outside clipping containers and clipped to the visible
  scrollport. The calendar's horizontal rail instead stays inside its animated
  body, beside the scrollport, so it scrolls, clips, and fades with the calendar.
  Nested rails keep separate hit areas; modal rails stay inside
  their dialog’s accessibility tree. Resize/mutation observers handle lazy content and newly opened
  pages. Measurements are batched into animation frames, with no per-frame
  React state updates. Closing a page removes its rails. Disabling the cursor
  for accessibility restores native scrollbars and removes all observers.
- Wheel scrolling refreshes the hovered content without restarting movement
  tweens. Unmanaged native surfaces use the browser cursor as a fallback.
- Pointer listeners use capture phase so drag controls cannot block tracking by
  stopping propagation. Release, cancellation, and lost capture reset drag state.
- Keyboard use, leaving the document, window blur, and hiding the tab hide
  the decorative hints. Movement restores them when appropriate.
- The root `data-custom-cursor` attribute is present only while the custom cursor
  is active. A CSS rule gated by the same accessibility media query suppresses
  the native cursor only while that attribute is present. Clearing it restores native pointer shapes immediately.
- Scoped GSAP contexts clean up tweens, listeners, the cube cursor observer, and
  the root attribute on unmount or media changes.

Keep labels upright by animating the bracket frame separately from its label.
Keep new hover behavior semantic and avoid per-pointer layout reads or new tweens.

## Validation

Run `tests/e2e/custom-cursor.spec.js` plus the desktop and blue-theme profiles of
`tests/e2e/about-animations.spec.js`. These cover tracking, drag feedback, real
certificate controls, keyboard and text editing, dynamic accessibility
preferences, touch devices, narrow windows, low-end desktops, captured drags, and
custom scrollbar drags on both axes, nested PDF scrolling, and rail cleanup.
The cursor suite keeps OS scrollbars visible to detect unintended native gutters. The renderer's inline canvas cursor remains the source for picking assertions.
CSS no longer hides it or replaces the native pointer.


## Explicit hints for interactive surfaces

Non-button interactions opt in with `data-cursor-label`; `data-cursor-pressed-label` can change the hint during a press or captured drag. The closest annotated surface or semantic control wins, so a gallery arrow keeps NEXT/PREV and a nested close button keeps CLOSE instead of inheriting its parent's hint. An empty explicit label opts static content out of a surrounding interactive surface.

TiltCard supplies TILT for the About portrait and all skill tiles. The Skills layer stack also advertises TILT. Screenshot galleries display VIEW / DRAG and retain DRAG during pointer capture on the wrapper. Clickable lightbox backdrops display CLOSE while static images inside them have no action label. Labels remain visible during presses. Ordinary buttons, links, fields, range/selection/toggle controls, disabled controls, download links, and document zoom controls retain appropriate semantic hints; native media and iframe controls keep their native cursor fallback.

Validation: ten cursor browser checks pass, including real portrait hover/press, all 25 skill tiles, the layer stack, captured gallery dragging, nested arrows, disabled controls, static content, exact cursor tracking, scrollbars, keyboard/accessibility preferences, and touch exclusion. Two targeted checks also pass after adding both lightbox backdrops. Build and focused lint pass; ProjectModal's one existing lint error is unchanged from HEAD. Artifacts: `/tmp/dinoweb-cursor-hints-final` and `/tmp/dinoweb-cursor-hints-lightboxes`.

## Viewport cursor replacement — 26 October 2026

The default pointer is hidden only while the custom cursor has a valid mouse position inside this document and is fully visible. The active-state CSS also covers buttons, links, text fields, the cube canvas, and portaled controls. Inline canvas cursor values continue supplying semantic hints without displaying a second native pointer.

Captured movement beyond any viewport edge clears the active attribute immediately. Leaving, blur, pagehide, resize, cancellation, keyboard use, reduced-motion/forced-colors changes, and unmount restore native pointer behavior. Native-control surfaces also clear the flag. The replacement opacity is set immediately before activating suppression, avoiding a blank-pointer interval on entry.

Validation: production build, targeted ESLint, and whitespace checks passed. Eleven cursor cases passed in `/tmp/dinoweb-cursor-replacement-checks/`; the boundary fixture now waits for the lazy cursor to mount before its first movement, and passed in `/tmp/dinoweb-cursor-boundaries-final/`. Together the 12 cases verify replacement over the cube and text controls, native-surface fallback, four captured viewport exits, blur/pagehide/resize restoration, both renderers, keyboard/accessibility changes, touch exclusion, scrollbars, and page interaction hints.
