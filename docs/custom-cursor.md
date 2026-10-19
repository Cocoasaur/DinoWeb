# Portfolio cursor

`src/components/ui/CustomCursor.jsx` provides a GSAP cursor using the portfolio's
corner brackets, precise point, theme colors, and small technical labels.
`src/styles/custom-cursor.css` owns its appearance.

The App lazy-loads it after the first scene frame when any available input
supports fine pointing and hover, with no reduced-motion preference or forced
colors. Its own media context uses the same query. Availability is independent
of window width and the WebGL performance tier, which can vary between browsers.
Hybrid devices can use a mouse alongside touch. Native cursors remain in place
until the component has tracked an actual mouse move; touch events hide it.

## Interaction and lifecycle

- The center point follows the pointer directly; the bracket frame trails with
  reusable `gsap.quickTo()` tweens. During a press, both follow the pointer
  directly. Pointer movement does not update React state.
- Buttons and links expand the frame and show action labels. The cube's inline
  cursor, updated by its renderer, supplies rotate, open, zoom, and drag states.
  Other canvases, including PDF pages, use the default custom cursor state.
- The visual is portaled to `body`, ignores pointer events, and is hidden from
  assistive technology. Text fields keep the custom pointer with a TYPE label
  and normal editing behavior. Embedded frames and native media controls retain their own
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
- Keyboard use, leaving the document, window blur, and hiding the tab restore
  native cursors. Movement restores the custom visual when appropriate.
- The root `data-custom-cursor` attribute is present only while the custom cursor
  is active. Its CSS replacement is also gated by the accessibility media query.
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
The cursor suite keeps OS scrollbars visible to detect unintended native gutters. The renderer's inline cursor
remains the source for picking assertions because CSS hides its visible cursor
while the custom cursor is active.
