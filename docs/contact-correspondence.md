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
