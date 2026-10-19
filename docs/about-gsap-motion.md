# About page GSAP motion

The About page is the first GSAP implementation on `DinoWeb_3D_v.2`.
Its existing content, certificate filters, document viewer, and contribution
controls remain the foundation for future About page work.

## Where to extend it

- `src/hooks/useAboutAnimations.js` owns GSAP registration, reversible reveals,
  keyboard focus handling, responsive media contexts, and layout refreshes.
- `useAboutAnimations` coordinates the heading, copy, portrait, dividers,
  education timeline, parameters, and section parallax.
- `useAboutCertificateAnimations` handles card cascades and pagination. Category,
  page, page-size, and device-tier changes rebuild only this motion scope.
- Pagination explicitly pans the overlay to the updated certificate grid after
  React commits it. GSAP drives the pan so layout refreshes cannot stop a native
  smooth scroll halfway. Reduced motion jumps instantly; user input cancels the
  pan. The new first row lands in the readable middle band instead of the upper
  exit zone. Category changes, resizing, and the initial mount do not request a pan.
- `useAboutDetailAnimations` runs when the lazy résumé and contribution viewers
  mount. Fixed-height controls and native scrollports fade in place, so their
  contents cannot slide underneath neighboring rows. Keep PDF canvases and
  contribution cells grouped to limit tween counts and preserve square cells.
- `src/pages/AboutPage.jsx` supplies stable animation targets and word spans.
  `src/styles/about-layout.css` supplies their layout and static appearance.
- `src/components/ui/Overlay.jsx` passes `motionReady` after the modal opens, so
  the opening choreography is visible after the camera transition.

## Motion contract

- The About layout follows ArtCraft's download-page grid philosophy:
  https://getartcraft.com/download. Numbered chapter bars, shared rules, equal
  columns, and consistent insets organize profile, certificates, documents,
  activity, and background without changing the portfolio's theme system.
- `src/styles/about-grid.css` owns the About-specific grid. The overlay's
  `data-page="about"` attribute scopes its full-width layout and close control;
  other portfolio pages retain their existing overlay spacing.
- Borders belong to stationary grid cells and chapter bars. Animate their inner
  text and media, never the section or grid itself. Certificate frames clip the
  animated buttons as an intentional reveal mask. Intro and background cells
  allow moving text and portraits to remain visible; portrait/image crops and
  the padded heading reveal mask retain their intended clipping.
- Certificate stagger columns follow the rendered CSS grid (three on desktop,
  two on phones), rather than assuming four columns from viewport width.

- ScrollTrigger follows `.portfolio-overlay-panel`, the native scroll container.
  Use layout offsets for trigger measurements; animated bounding rectangles
  change during transforms and can cause trigger positions to drift.
- The top progress indicator uses a GSAP quick setter driven by native scroll,
  independently of ScrollTrigger refreshes. If lazy content changes the scroll
  range, it retains its current value and rebases its remaining travel to the
  top/bottom. The PDF placeholder reserves the viewer's responsive height.
- Contribution weeks use equal flexible columns, square day cells, and uniform
  3px row/column gaps. Weekday text never determines row height. Narrow screens
  scroll the minimum-width year instead of distorting its cells.
- Reveals have three timeline segments: entrance, readable rest, and a distinct
  exit. Scrolling backward retraces these segments without remounting content.
- Entry motion runs through a short lower viewport band, approximately 96% to 84%,
  so incoming content reaches full opacity sooner.
  Upper exits run as the element's bottom crosses 34% to 8%, completing inside
  the panel before its last lines are clipped. An in/out ease makes both the lift
  and its scroll reversal visible. Text travels 12–24px, portraits 32px, and
  certificates 22–36px with small rotations; short controls move only 10px.
  PDF controls, document scrollports, and the calendar fade in place to retain
  their bounds and scrollbar alignment.
  Certificate thumbnails have their own upper exit, so a long caption does not
  postpone the image animation until it is already clipped. They inherit the
  card's lower entrance and are restored with the card on keyboard focus.
  The About title has its own upward letter exit through the heading mask;
  its opening animation and readable rest remain separate from that exit.
  Bounds are adjusted so the final rows can finish revealing at the scroll limit.
- The calendar's horizontal custom rail lives beside its native scrollport,
  inside the animated body. Browser layout keeps it attached below the legend,
  clips it with the panel, and applies the same fade without viewport clamping.
  Pointer capture, keyboard scrolling, and the custom cursor remain available.
- `scrollStagger` offsets scroll distances, giving cards and controls a cascade
  that remains visible while scrubbing. Time delays serve the opening sequence.
- Keep resting content free of motion transforms and opacity overrides. Preserve
  TiltCard's ownership of its pointer transform by animating its outer wrapper.
- Use a scoped `useGSAP`/`gsap.matchMedia` context and revert on unmount. Refresh
  after actual layout changes such as lazy content, fonts, or filter results.
- Keyboard focus may settle an animated control immediately. Mouse/touch focus
  must not move a control between pointer-down and click.
- Respect `prefers-reduced-motion`, simplify movement for smaller or low-end
  devices, and keep text selectable and readable by assistive technology.

## Validation

Start a local server, then point Playwright at its `/DinoWeb/` base URL:

```sh
npm run dev -- --host 127.0.0.1 --port 5173
```

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173/DinoWeb/ npx playwright test \
  tests/e2e/about-animations.spec.js tests/e2e/responsive-quality.spec.js \
  --grep 'reveals panel|fits sharp PDFs' --workers=1
```

The checks cover desktop, the blue theme, phone, tablet, portrait monitor,
low-end phone, reduced motion, visible
scroll reversal, word reveals, card staggering, upward exits, keyboard access,
filters, pagination, lightboxes, modal reopening, and responsive PDF rendering.
The About suite also samples toolbar bounds during entry/exit, measures day-cell
aspect ratios and both gaps, checks calendar rail alignment and inherited opacity
in narrow mouse viewports through both scroll directions, and delays the document
module to exercise progress
while first-load content and scroll ranges change in both directions.
It also checks thumbnail motion while captions remain readable, verifies the
same partial exit on scroll reversal, and restores both image and card on focus.
Run `npm run build` and lint the changed animation files as well. Repository-wide
lint also contains pre-existing errors outside the new motion implementation.

For additional About sections, add stable targets within the existing scopes,
keep lazy content in its own mount lifecycle, and extend these interaction checks.
