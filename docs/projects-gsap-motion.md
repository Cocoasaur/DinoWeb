# Projects gallery and motion

The Projects page uses the same fixed header frame and native overlay scrollport as About and Skills. A full-width introduction, search, and discipline filters lead into screenshot-led project case studies with descriptions, screenshots, tools, and live/repository links. Existing project descriptions, images, roles, and repository visibility remain the content source. `title`, `category`, and `categoryLabel` in `src/data/projectsData.js` supply presentation and filter metadata.

## Introduction layout

At desktop widths (1024px and above), the existing headline occupies the left column. The description, totals, and Explore work control occupy the right column, bringing the project collection higher into view after removal of the hero gallery. Tablet and phone layouts retain their original vertical order. The same independent GSAP reveal anchors remain around every text group; no duplicate content or replacement hero media is added.

## Motion and 3D surfaces

`src/hooks/useProjectsMotion.js` owns scoped GSAP timelines and ScrollTriggers. It starts the intro after the overlay opens. Stationary layout anchors supply `scrollRevealBounds` measurements, while their children move through entry, a fully readable resting phase, and upper-edge exit. Reversing scroll restores the content. The entry band is 96%–84% of content-viewport height; the exit band is 34%–8%, shared with About and Skills.

Cards, the case-study gallery, and detail tools have depth and X/Y rotation. Desktop entrances use a 32-degree X fold and -60px depth; compact profiles use 22 degrees and -32px. Exits use 26/18 degrees and -42/-24px depth. At rest, transforms and opacity are cleared so content is flat and fully visible. Text uses gentler translation and fading. The header stays outside these animations, and the progress line tracks native scrolling beneath it.

The shared `TiltCard` handles mouse/finger interaction on a separate inner wrapper, keeping pointer transforms independent from the outer GSAP scroll transforms. Project cards distinguish a tap from a finger drag before navigating. Touch highlights clear on release, cancellation, scrolling, resizing, blur, and unmount. Native vertical panning and pinch zoom remain available. Scroll and pointer transforms are bypassed in reduced-motion mode while color feedback stays available.

The gallery and case study use existing screenshots. There is no additional WebGL scene, Spline runtime, dependency, or idle animation loop. Motion uses transforms and opacity. A single scheduled refresh handles content/viewport changes; scoped contexts, observers, and focus handlers are cleaned up on filtering, detail navigation, preference changes, and unmount. Keyboard-focused controls remain readable during scrolling.

## Navigation and interactions

Search matches project names/titles, roles, statuses, categories, and stacks, combined with the chosen discipline. Clear and empty-result reset controls restore the collection. Opening a project records the list's actual activation scroll position; Back restores it along with the existing query/filter. The header's close button becomes Back in the detail view.

Project details keep the screenshot carousel, pointer dragging, slide dots/arrows, keyboard navigation, and portaled lightbox. Live sites and public repositories are links; private repositories have a static note instead of an unusable link. Detail tool logos are grayscale in Clair Obscur and white in Demain Soir Bleu, revealing their source colors on mouse hover or touch.

Cursor hints come from the existing semantic/explicit hint system: OPEN for project buttons, TILT for cards/tools, VIEW / DRAG for galleries, and CLOSE/BACK for navigation. The cursor remains absent on touch devices.

## Validation

`tests/e2e/projects-animations.spec.js` covers desktop, both themes, phone, tablet, portrait monitor, 320px phone, landscape, and reduced motion. It checks every project's reachable 3D entry/exit, restoration on reversal, loaded screenshots, horizontal overflow, search/filter/empty states, detail links, private repository states, list-position restoration, fixed headers, and closing/reopening through the same cube. Separate native Chrome touch cases cover phone, blue-theme tablet, and reduced motion, including drag-versus-tap behavior, native panning, and detail-tool color feedback. Native inertia is allowed to settle before independent taps, and animated tool surfaces settle before hit testing.

The existing cursor gallery regression also checks real card opening, captured screenshot dragging, nested arrows, disabled states, and lightbox actions. Emulated Chrome touch coverage does not establish physical Safari behavior.

Future Spline work is tracked separately in [issue #26](https://github.com/Cocoasaur/DinoWeb/issues/26).

## Verified build — October 22, 2026

Production build, changed-file ESLint, and whitespace checks pass. All 13 final Projects/gallery browser checks pass, covering the eight layouts, three native touch profiles, gallery cursor behavior, and persistence/public links. The full 10-check cursor suite also passed during integration; its Projects gallery case was repeated against the final motion. Evidence: `/tmp/dinoweb-projects-release/` and `/tmp/dinoweb-projects-checks/`.

Fresh Lighthouse 13.4.1 navigation audits used standard desktop and default mobile presets, fresh Chrome profiles, and unchanged CPU/network settings on the local production preview. Each profile ran once, sequentially, with no warnings.

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100/100 | 0.33 s | 0.57 s | 0 ms | 0.00018 |
| Mobile | 100/100 | 0.91 s | 1.22 s | 0 ms | 0.00079 |

These are local homepage loading measurements, not scrolling frame-rate measurements or a deployed-device guarantee. Full HTML/JSON reports, audit settings, and source/build hashes are in `/tmp/dinoweb-projects-lighthouse/`. Audited production index SHA-256: `74f9ca5c6d943f3502499d62122e542b579548c52ac52c0e5b8fd9283c0cb50c`.

## Showcase follow-up — October 22, 2026

Removed the permanent X/Y/Z skew and coordinate decorations from the hero preview. The preview rests level and uses a five-degree interactive tilt. A single visible preview switches between all five projects using buttons, numbered selectors, keyboard arrows, and native horizontal touch swipes. The selected preview opens its corresponding case study. Switching is user-controlled, uses a scoped transform/opacity tween, and becomes instant with reduced motion.

The follow-up production build, focused ESLint, and whitespace checks pass. Six browser checks pass: three showcase profiles (desktop, tablet, and reduced-motion phone) covering selection, wraparound, keyboard input, loaded images, native swipes, one visible preview, neutral rotation, overflow, and case-study navigation; plus the three existing native touch regressions for panning, tilt, drag-versus-tap, and tool highlights. Screenshots and results are in `/tmp/dinoweb-showcase-final/`. The Lighthouse measurements above refer to the earlier recorded build; they were not rerun for this follow-up.

## Release verification

The final combined Projects and static Contact build passes changed-file ESLint, production build, and whitespace checks. All 21 integrated browser checks pass, including the eight Projects layouts, native touch regressions, showcase navigation, five Contact layouts, and the gallery cursor regression. Results and screenshots are in `/tmp/dinoweb-redesign-release-checks/`.

Fresh standard Lighthouse desktop and mobile homepage navigation audits both score 100/100, with no audit warnings. These measure local loading performance, not overlay scroll frame rates or physical-device performance.

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100/100 | 0.34 s | 0.59 s | 0 ms | 0.00017 |
| Mobile | 100/100 | 0.75 s | 0.98 s | 22 ms | 0.00081 |

Reports and source/build hashes: `/tmp/dinoweb-redesign-release-lighthouse/`. Audited production index SHA-256: `3b38136ef84db236aaf418676d45a90eed65e040d752db59fcbd24d382e1fa54`.

## Introduction refinement — October 25, 2026

The hero now contains only the introduction, totals and Explore work action, across the full panel width. The separate showcase, switching controls, preview animation and their styles have been removed. The searchable project cards and case-study screenshot galleries remain available. Hero regression coverage replaces the removed showcase tests; native finger tilt/pan checks now target the project cards.

The combined remaining changes pass production build, changed-file ESLint, and 22 focused Chromium checks: three full-width hero layouts, eight shared overlay close/navigation checks, four unconfigured-prototype/navigation-isolation cases, four configured runtime lifecycle/failure cases, and three native touch cases. Screenshots and reports are in `/tmp/dinoweb-second-half-checks/`, `/tmp/dinoweb-second-half-runtime/`, and `/tmp/dinoweb-second-half-touch/`. Spline tests validate the local integration boundary; no real exported scene is configured. These checks are not a fresh Lighthouse measurement.

## Desktop introduction spacing — 26 October 2026

The desktop introduction now places its description, project/discipline counts, and Explore work control beside the headline. The collection starts higher on screen. Five introduction checks passed at 1024px, 1440px, and 1920px desktop widths, tablet, and phone with reduced motion; these also cover search, detail navigation, and retained mobile stacking. Desktop screenshots in both themes were inspected. Together with six shadow/transition checks, all 11 browser checks passed in `/tmp/dinoweb-shadow-layout-final/`. Production build, targeted ESLint, and whitespace checks passed.
