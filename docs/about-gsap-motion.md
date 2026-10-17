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
- `useAboutDetailAnimations` runs when the lazy résumé and contribution viewers
  mount. Keep PDF canvases and contribution cells grouped to limit tween counts.
- `src/pages/AboutPage.jsx` supplies stable animation targets and word spans.
  `src/styles/about-layout.css` supplies their layout and static appearance.
- `src/components/ui/Overlay.jsx` passes `motionReady` after the modal opens, so
  the opening choreography is visible after the camera transition.

## Motion contract

- ScrollTrigger follows `.portfolio-overlay-panel`, the native scroll container.
  Use layout offsets for trigger measurements; animated bounding rectangles
  change during transforms and can cause trigger positions to drift.
- Reveals have three timeline segments: entrance, readable rest, and a distinct
  exit. Scrolling backward retraces these segments without remounting content.
- Entry motion runs through the lower viewport band, approximately 96% to 70%.
  Upper exits run as the element's bottom crosses approximately 24% to 4%.
  Bounds are adjusted so the final rows can finish revealing at the scroll limit.
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

The seven checks cover desktop, phone, low-end phone, reduced motion, visible
scroll reversal, word reveals, card staggering, upward exits, keyboard access,
filters, pagination, lightboxes, modal reopening, and responsive PDF rendering.
Run `npm run build` and lint the changed animation files as well. Repository-wide
lint also contains pre-existing errors outside the new motion implementation.

For additional About sections, add stable targets within the existing scopes,
keep lazy content in its own mount lifecycle, and extend these interaction checks.
