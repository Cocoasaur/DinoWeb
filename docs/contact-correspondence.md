# Static Contact correspondence desk

Contact keeps its letter-and-envelope design, existing GSAP motion, fixed close header, and theme support. It now contains only public contact information, direct links, and one email copy button. The former topic choices, name and message fields, draft builder, and Open email app action have been removed. No Gmail fallback was added.

The email address is a selectable plain `mailto:` link with no subject or body parameters. Visitors can copy it using the prominent copy button, then paste it into their preferred email service. The button announces clipboard success or failure honestly; the checked legacy fallback restores focus and cleans up its temporary element. GitHub, LinkedIn, Stack Overflow, availability, response time, and language information are unchanged.

`useContactsMotion` uses scoped GSAP timelines with stationary layout anchors and the shared entry (96%–84%) and exit (34%–8%) bands. The paper enters and exits with a small fold, rests level, reverses with scrolling, and remains readable while its controls have focus. Reduced motion bypasses animation. All observers, listeners, scheduled frames, and animations are cleaned up.

`tests/e2e/contacts-page.spec.js` covers desktop, blue theme, phone, 320px phone, and reduced-motion tablet. It checks the absence of forms, direct email and social links, selectable address text, the single copy button, clipboard failure feedback, focused-surface readability, native touch panning, overflow, fixed header alignment, and close navigation through the cube. Chrome touch emulation does not establish physical Safari behavior.

Verified locally on October 22, 2026: build, focused ESLint, and whitespace checks passed. All five browser profiles passed against the static Contact page. Results and screenshots: `/tmp/dinoweb-static-contacts-final/`. No deployment or Lighthouse audit was performed for this update.

Removed the duplicate circular copy-email postmark and its responsive styles. The main copy button remains in the contact letter, and the introduction uses the available width.

## Release verification

The final combined Projects and static Contact build passes changed-file ESLint, production build, and whitespace checks. All 21 integrated browser checks pass, including the eight Projects layouts, native touch regressions, showcase navigation, five Contact layouts, and the gallery cursor regression. Results and screenshots are in `/tmp/dinoweb-redesign-release-checks/`.

Fresh standard Lighthouse desktop and mobile homepage navigation audits both score 100/100, with no audit warnings. These measure local loading performance, not overlay scroll frame rates or physical-device performance.

| Profile | Performance | FCP | LCP | Blocking time | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop | 100/100 | 0.34 s | 0.59 s | 0 ms | 0.00017 |
| Mobile | 100/100 | 0.75 s | 0.98 s | 22 ms | 0.00081 |

Reports and source/build hashes: `/tmp/dinoweb-redesign-release-lighthouse/`. Audited production index SHA-256: `3b38136ef84db236aaf418676d45a90eed65e040d752db59fcbd24d382e1fa54`.

## Individual scroll reveals — 25 October 2026

Contact now reveals each introduction line, recipient label/name, postmark, email link, explanation, copy control, desk caption, availability detail, social row, and sign-off independently. The decorative envelope has its own motion surface; the letter layout stays stationary so child animations do not inherit a second fade or transform. The clipboard status uses a brief entrance and remains readable as sticky feedback.

The hook continues to use the same `scrollRevealBounds` utility as About, Skills, and Projects: entrance from 96% to 84% of the scroll panel, and upper exit from 34% to 8%, measured using stationary layout anchors. Scroll motion reverses in either direction. Only the opening of initially visible content uses a short stagger; scrolling retains the shared viewport boundaries. Reduced effects use smaller movements, reduced motion skips animation, and keyboard-focused controls stay at rest without snapping pointer taps. The masthead and close control remain fixed above the scrolling panel.

Validation: production build, focused ESLint, and whitespace checks pass. All five Contact interaction profiles pass, alongside three scroll-animation profiles (desktop, phone, and blue-theme tablet) checking individual content, reversible entrance/exit bands, and pinned-header alignment. Browser results: `/tmp/dinoweb-contact-scroll-final/` (interaction checks) and `/tmp/dinoweb-contact-motion-verified/` (final motion checks). No deployment or new Lighthouse measurement was performed.

## Opening smoothness fix — 25 October 2026

Frame-by-frame checks reproduced a flash in the first opening on both desktop and phone: a delayed heading became fully visible before its tween began, then dropped below 8% opacity. The previous `isActive()` check returned false during the stagger delay and cleared the hidden entrance styles too early.

An explicit pending-entrance state now preserves those styles throughout the delay and tween. Refresh callbacks leave that entrance running when scroll position and the readable state have not changed; actual scrolling or keyboard focus still takes control immediately. Opening durations are 0.75 seconds on the full-effects profile and 0.55 seconds on reduced-effects profiles, with a shorter stagger. Temporary compositor hints are removed at rest. The shared scroll viewport boundaries and reduced-motion behavior are unchanged.

`contacts-opening.spec.js` samples the introduction across animation frames on desktop and phone, including a viewport refresh during the entrance. It checks continuous opacity and movement toward rest without the previous reset.

Validation: production build, focused ESLint, and whitespace checks passed. All ten browser checks passed: two frame-sampled opening regressions, three viewport/scroll reversal profiles, and five Contact interaction profiles. Results: `/tmp/dinoweb-contact-opening-after/`. The two opening regressions failed against the previous build and passed after this fix.

## Scroll progress consistency — 25 October 2026

Contact now has the same 2px sticky, left-to-right scroll progress indicator as About, Skills, and Projects. It sits at the top of the native scroll panel, immediately beneath the fixed masthead, and uses the active Contact theme ink. Its fill tracks the panel’s real scroll range and refreshes after layout changes. It remains functional with reduced motion and is excluded from content entrance/exit animations and pointer interaction.

Validation: production build, focused ESLint, and whitespace checks passed. Seven browser checks passed, covering Contact progress at the top/middle/bottom and its fixed position below the header on desktop, blue theme, phone, small phone, and reduced-motion tablet, plus both opening smoothness regressions. Results: `/tmp/dinoweb-contact-progress-checks/`.
